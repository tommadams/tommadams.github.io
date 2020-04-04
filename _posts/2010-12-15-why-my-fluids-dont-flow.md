---
layout: post
title: "Why my fluids don't flow"
author: Tom Madams
mathjax: true
gh_comment_id: 3
---

I have an unopened copy of [Digital Color Management](http://www.amazon.com/Digital-Color-Management-Wiley--Technology/dp/047051244X/ref=sr_1_1?ie=UTF8&qid=1292301078&sr=8-1) sitting on my desk. It's staring at me accusingly.

In order to keep myself distracted from its dirty looks, I've been tinkering around with fluid simulation. [Miles Macklin](http://mmack.wordpress.com/) has done some great work with Eulerian (grid based) solvers, so in an effort to distance myself from the competition, I'm sticking to 2D Lagrangian (particle based) simulation.

Until recently, I'd always thought that particle based fluid simulation was complicated and involved _heavy maths_. This wasn't helped by the fact that most of the papers on the subject have serious sounding names like [Particle-based Viscoelastic Fluid Simulation](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.59.9379&rep=rep1&type=pdf), [Weakly compressible SPH for free surface flows](http://cg.informatik.uni-freiburg.de/publications/sphSCA2007.pdf), or even [Smoothed Particle Hydrodynamics and Magnetohydrodynamics](http://arxiv.org/abs/1012.1885).

It wasn't until I finally took the plunge and tried writing my own Smoothed Particle Hydrodynamics simulation that I found that it can be quite easy, provided you work from the right papers. SPH has a couple of advantages over grid based methods: it is trivial to ensure that mass is exactly conserved, and free-surfaces (the boundary between fluid and non-fluid) come naturally. Unfortunately, SPH simulations have a tendency to explode if the time step is too large and getting satisfactory results is heavily dependent on finding "good" functions with which to model the inter-particle forces.

I had originally intended to write an introduction to SPH, but soon realised that it would make this post intolerably long, so instead I'll refer to the papers that I used when writing my own sim. Pretty much every SPH paper comes with an introduction to the subject, invariably in section <b>2. Related Work</b>.

The first paper I tried implementing was [Particle-Based Fluid Simulation for Interactive Applications](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.2.7720&rep=rep1&type=pdf) by Müller et. al. It serves as a great introduction to SPH with a very good discussion of kernel weighting functions, but I had real difficulty getting decent results. In the paper pressure, viscosity and surface tension forces are modeled using following equations:

{% raw %}
$$\textbf{f}_i^{pressure} = -\sum_{j}m_j\frac{p_j}{\rho_j}\nabla{W(\textbf{r}_i-\textbf{r}_j, h)} \\
\textbf{f}_i^{viscosity} = \mu\sum_{j}m_j\frac{\textbf{v}_j-\textbf{v}_i}{\rho_j}\nabla^2W(\textbf{r}_i-\textbf{r}_j, h) \\
c_S(\textbf{r}) = \sum_jm_j\frac{1}{\rho_j}W(\textbf{r}-\textbf{r}_j, h) \\
\textbf{f}_i^{surface} = -\sigma\nabla^2c_S\frac{\textbf{n}}{|\textbf{n}|}$$
{% endraw %}

The pressure for each particle is calculated from its density using:

{% raw %}
$$P_i = k(\rho_i - \rho_0)$$ where $\rho_0 $ is the some non-zero rest density.
{% endraw %}

The first problem I encountered was with the pressure model; it only acts as a repulsive force if the particle density is greater than the rest density. If a particle has only a small number of neighbours, the pressure force will attract them to form a cluster of particles all sharing the same space. In my experiments, I often found large numbers of clusters of three or four particles all in the same position. It took me a while to figure out what was going on because Müller states that the value of the rest density "mathematically has no effect on pressure forces", which is only true given a fairly uniform density of particles far from the boundary.

The second problem I found was with the surface tension force. It was originally developed for multiphase fluid situations with no free surfaces and doesn't behave well near the surface boundary; in fact it can actually pull the fluid into concave shapes. Additionally, because it's based on a Laplacian, it's very sensitive to fluctuations in the particle density, which are the norm at the surface boundary.

After a week or so of trying, this was my best result:

<div class="video-embed">
{%- include vimeo.html id=17253183 -%}
</div>

From the outset, you can see the surface tension force is doing weird things. Even worse, once the fluid starts to settle the particles tended to stack on top of each and form a very un-fluid blob.

On the up side, I did create possibly my best ever bug when implementing the surface tension model; I ended up with something resembling microscopic life floating around under the microscope:

<div class="video-embed">
{%- include vimeo.html id=17241730 -%}
</div>

The next paper I tried was [Particle-based Viscoelastic Fluid Simulation](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.59.9379&rep=rep1&type=pdf) by Clavet et al. I actually had a lot of success with their paper and had a working implementation of their basic model up and running in less than two hours. Albeit minus the viscoelasticity. In addition to the pressure force described in Müller's paper, they model "near" density and pressure, which are similar to their regular counterparts but with a zero rest density and different kernel functions:<br>

{% raw %}
$$P_i = k(\rho_i - \rho_0) \\
P_i^{near} = k^{near} \rho_i^{near} \\
\rho_i = \sum_j (1 - \frac{|\textbf{r}_i - \textbf{r}_j|}{h}) ^ 2 \\
\rho_i^{near} = \sum_j (1 - \frac{|\textbf{r}_i - \textbf{r}_j|}{h}) ^ 3$$
{% endraw %}

This near pressure ensures a minimum spacing and as an added bonus performs a decent job of modelling surface tension too. This is the first simulation I ran using their pressure and viscosity forces:

<div class="video-embed">
{%- include vimeo.html id=17253237 -%}
</div>

Although initial results were promising, I struggled when tweaking the parameters to find a good balance between a fluid that was too compressible and one that was too viscous. Also, what I really wanted was to do multiphase fluid simulation. This wasn't covered in the viscoelastic paper, so my next port of call was [Weakly compressible SPH for free surface flows](cg.informatik.uni-freiburg.de/publications/sphSCA2007.pdf) by Becker et al. In this paper, surface tension is modeled as:<br>

{% raw %}
$$\textbf{f}_i^{surface} = -\frac{\kappa}{m_i} \sum_j m_j W(\textbf{r}_i-\textbf{r}_j) (\textbf{r}_i - \textbf{r}_j)$$<br>
{% endraw %}

They also discuss using Tait's equation for the pressure force, rather than one based on the ideal gas law:<br>

{% raw %}
$P_i = B((\frac{\rho_i}{\rho_0})^\gamma - 1)$  with $\gamma = 7$
{% endraw %}

I gave that a shot, but the large exponent caused the simulation to explode unless I used a _really_ small time step. Instead, I found that modifying the pressure forces from the viscoelastic paper slightly gave a much less compressible fluid without the requirement for a tiny time step:<br>

{% raw %}
$$\rho_i = \sum_j (1 - \frac{|\textbf{r}_i - \textbf{r}_j|}{h}) ^ 3 \\
\rho_i^{near} = \sum_j (1 - \frac{|\textbf{r}_i - \textbf{r}_j|}{h}) ^ 4 $$
{% endraw %}

Here's one of my more successful runs:

<div class="video-embed">
{%- include vimeo.html id=17666433 -%}
</div>

And here is a slightly simplified version of the code behind it. Be warned, it's quite messy; I'm rather enjoying hacking code together these days:

```cpp
#include <float.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <memory.h>
#include <glut.h>


#define kScreenWidth 640
#define kScreenHeight 480
#define kViewWidth 10.0f
#define kViewHeight (kScreenHeight*kViewWidth/kScreenWidth)
#define kPi 3.1415926535f
#define kParticleCount 3000

#define kRestDensity 82.0f
#define kStiffness 0.08f
#define kNearStiffness 0.1f
#define kSurfaceTension 0.0004f
#define kLinearViscocity 0.5f
#define kQuadraticViscocity 1.0f

#define kParticleRadius 0.05f
#define kH (6*kParticleRadius)
#define kFrameRate 20
#define kSubSteps 7

#define kDt ((1.0f/kFrameRate) / kSubSteps)
#define kDt2 (kDt*kDt)
#define kNorm (20/(2*kPi*kH*kH))
#define kNearNorm (30/(2*kPi*kH*kH))


#define kEpsilon 0.0000001f
#define kEpsilon2 (kEpsilon*kEpsilon)


struct Particle
{
    float x;
    float y;

    float u;
    float v;

    float P;
    float nearP;

    float m;

    float density;
    float nearDensity;
    Particle* next;
};

struct Vector2
{
    Vector2() { }
    Vector2(float x, float y) : x(x) , y(y) { }
    float x;
    float y;
};

struct Wall
{
    Wall() { }
    Wall(float _nx, float _ny, float _c) : nx(_nx), ny(_ny), c(_c) { }
    float nx;
    float ny;
    float c;
};

struct Rgba
{
    Rgba() { }
    Rgba(float r, float g, float b, float a) : r(r), g(g), b(b), a(a) { }
    float r, g, b, a;
};

struct Material
{
    Material() { }
    Material(const Rgba& colour, float mass, float scale, float bias) : colour(colour) , mass(mass) , scale(scale) , bias(bias) { }
    Rgba colour;
    float mass;
    float scale;
    float bias;
};

#define kMaxNeighbourCount 64
struct Neighbours
{
    const Particle* particles[kMaxNeighbourCount];
    float r[kMaxNeighbourCount];
    size_t count;
};

size_t particleCount = 0;
Particle particles[kParticleCount];
Neighbours neighbours[kParticleCount];
Vector2 prevPos[kParticleCount];
Vector2 relaxedPos[kParticleCount];
Material particleMaterials[kParticleCount];
Rgba shadedParticleColours[kParticleCount];

#define kWallCount 4
Wall walls[kWallCount] =
{
    Wall( 1,  0, 0),
    Wall( 0,  1, 0),
    Wall(-1,  0, -kViewWidth),
    Wall( 0, -1, -kViewHeight)
};

#define kCellSize kH
const size_t kGridWidth = (size_t)(kViewWidth / kCellSize);
const size_t kGridHeight = (size_t)(kViewHeight / kCellSize);
const size_t kGridCellCount = kGridWidth * kGridHeight;
Particle* grid[kGridCellCount];
size_t gridCoords[kParticleCount*2];


struct Emitter
{
    Emitter(const Material& material, const Vector2& position, const Vector2& direction, float size, float speed, float delay)
        : material(material), position(position), direction(direction), size(size), speed(speed), delay(delay), count(0)
    {
        float len = sqrt(direction.x*direction.x + direction.y*direction.y);
        this->direction.x /= len;
        this->direction.y /= len;
    }
    Material material;
    Vector2 position;
    Vector2 direction;
    float size;
    float speed;
    float delay;
    size_t count;
};

#define kEmitterCount 2
Emitter emitters[kEmitterCount] =
{
    Emitter(
        Material(Rgba(0.6f, 0.7f, 0.9f, 1), 1.0f, 0.08f, 0.9f),
        Vector2(0.05f*kViewWidth, 0.8f*kViewHeight), Vector2(4, 1), 0.2f, 5, 0),
    Emitter(
        Material(Rgba(0.1f, 0.05f, 0.3f, 1), 1.4f, 0.075f, 1.5f),
        Vector2(0.05f*kViewWidth, 0.9f*kViewHeight), Vector2(4, 1), 0.2f, 5, 6),
};


float Random01() { return (float)rand() / (float)(RAND_MAX-1); }
float Random(float a, float b) { return a + (b-a)*Random01(); }


void UpdateGrid()
{
    // Clear grid
    memset(grid, 0, kGridCellCount*sizeof(Particle*));

    // Add particles to grid
    for (size_t i=0; i<particleCount; ++i)
    {
        Particle& pi = particles[i];
        int x = pi.x / kCellSize;
        int y = pi.y / kCellSize;

        if (x < 1)
            x = 1;
        else if (x > kGridWidth-2)
            x = kGridWidth-2;

        if (y < 1)
            y = 1;
        else if (y > kGridHeight-2)
            y = kGridHeight-2;

        pi.next = grid[x+y*kGridWidth];
        grid[x+y*kGridWidth] = &pi;

        gridCoords[i*2] = x;
        gridCoords[i*2+1] = y;
    }
}


void ApplyBodyForces()
{
    for (size_t i=0; i<particleCount; ++i)
    {
        Particle& pi = particles[i];
        pi.v -= 9.8f*kDt;
    }
}


void Advance()
{
    for (size_t i=0; i<particleCount; ++i)
    {
        Particle& pi = particles[i];

        // preserve current position
        prevPos[i].x = pi.x;
        prevPos[i].y = pi.y;

        pi.x += kDt * pi.u;
        pi.y += kDt * pi.v;
    }
}


void CalculatePressure()
{
    for (size_t i=0; i<particleCount; ++i)
    {
        Particle& pi = particles[i];
        size_t gi = gridCoords[i*2];
        size_t gj = gridCoords[i*2+1]*kGridWidth;

        neighbours[i].count = 0;

        float density = 0;
        float nearDensity = 0;
        for (size_t ni=gi-1; ni<=gi+1; ++ni)
        {
            for (size_t nj=gj-kGridWidth; nj<=gj+kGridWidth; nj+=kGridWidth)
            {
                for (Particle* ppj=grid[ni+nj]; NULL!=ppj; ppj=ppj->next)
                {
                    const Particle& pj = *ppj;

                    float dx = pj.x - pi.x;
                    float dy = pj.y - pi.y;
                    float r2 = dx*dx + dy*dy;
                    if (r2 < kEpsilon2 || r2 > kH*kH)
                        continue;

                    float r = sqrt(r2);
                    float a = 1 - r/kH;
                    density += pj.m * a*a*a * kNorm;
                    nearDensity += pj.m * a*a*a*a * kNearNorm;

                    if (neighbours[i].count < kMaxNeighbourCount)
                    {
                        neighbours[i].particles[neighbours[i].count] = &pj;
                        neighbours[i].r[neighbours[i].count] = r;
                        ++neighbours[i].count;
                    }
                }
            }
        }

        pi.density = density;
        pi.nearDensity = nearDensity;
        pi.P = kStiffness * (density - pi.m*kRestDensity);
        pi.nearP = kNearStiffness * nearDensity;
    }
}


void CalculateRelaxedPositions()
{
    for (size_t i=0; i<particleCount; ++i)
    {
        const Particle& pi = particles[i];

        float x = pi.x;
        float y = pi.y;

        for (size_t j=0; j<neighbours[i].count; ++j)
        {
            const Particle& pj = *neighbours[i].particles[j];
            float r = neighbours[i].r[j];
            float dx = pj.x - pi.x;
            float dy = pj.y - pi.y;

            float a = 1 - r/kH;

            float d = kDt2 * ((pi.nearP+pj.nearP)*a*a*a*kNearNorm + (pi.P+pj.P)*a*a*kNorm) / 2;

            // relax
            x -= d * dx / (r*pi.m);
            y -= d * dy / (r*pi.m);

            // surface tension
            if (pi.m == pj.m)
            {
                x += (kSurfaceTension/pi.m) * pj.m*a*a*kNorm * dx;
                y += (kSurfaceTension/pi.m) * pj.m*a*a*kNorm * dy;
            }

            // viscocity
            float du = pi.u - pj.u;
            float dv = pi.v - pj.v;
            float u = du*dx + dv*dy;
            if (u > 0)
            {
                u /= r;

                float a = 1 - r/kH;
                float I = 0.5f * kDt * a * (kLinearViscocity*u + kQuadraticViscocity*u*u);

                x -= I * dx * kDt;
                y -= I * dy * kDt;
            }

        }

        relaxedPos[i].x = x;
        relaxedPos[i].y = y;
    }
}


void MoveToRelaxedPositions()
{
    for (size_t i=0; i<particleCount; ++i)
    {
        Particle& pi = particles[i];
        pi.x = relaxedPos[i].x;
        pi.y = relaxedPos[i].y;
        pi.u = (pi.x - prevPos[i].x) / kDt;
        pi.v = (pi.y - prevPos[i].y) / kDt;
    }
}


void ResolveCollisions()
{
    for (size_t i=0; i<particleCount; ++i)
    {
        Particle& pi = particles[i];

        for (size_t j=0; j<kWallCount; ++j)
        {
            const Wall& wall = walls[j];
            float dis = wall.nx*pi.x + wall.ny*pi.y - wall.c;
            if (dis < kParticleRadius)
            {
                float d = pi.u*wall.nx + pi.v*wall.ny;
                if (dis < 0)
                    dis = 0;
                pi.u += (kParticleRadius - dis) * wall.nx / kDt;
                pi.v += (kParticleRadius - dis) * wall.ny / kDt;
            }
        }
    }
}


void Render()
{
    glClearColor(0.02f, 0.01f, 0.01f, 1);
    glClear(GL_COLOR_BUFFER_BIT);

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glOrtho(0, kViewWidth, 0, kViewHeight, 0, 1);

    glEnable(GL_POINT_SMOOTH);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    for (size_t i=0; i<particleCount; ++i)
    {
        const Particle& pi = particles[i];
        const Material& material = particleMaterials[i];

        Rgba& rgba = shadedParticleColours[i];
        rgba = material.colour;
        rgba.r *= material.bias + material.scale*pi.P;
        rgba.g *= material.bias + material.scale*pi.P;
        rgba.b *= material.bias + material.scale*pi.P;
    }

    glEnableClientState(GL_VERTEX_ARRAY);
    glEnableClientState(GL_COLOR_ARRAY);

    glPointSize(2.5f*kParticleRadius*kScreenWidth/kViewWidth);

    glColorPointer(4, GL_FLOAT, sizeof(Rgba), shadedParticleColours);
    glVertexPointer(2, GL_FLOAT, sizeof(Particle), particles);
    glDrawArrays(GL_POINTS, 0, particleCount);

    glDisableClientState(GL_COLOR_ARRAY);
    glDisableClientState(GL_VERTEX_ARRAY);

    glutSwapBuffers();
}


void EmitParticles()
{
    if (particleCount == kParticleCount)
        return;

    static int emitDelay = 0;
    if (++emitDelay < 3)
        return;

    for (size_t emitterIdx=0; emitterIdx<kEmitterCount; ++emitterIdx)
    {
        Emitter& emitter = emitters[emitterIdx];
        if (emitter.count >= kParticleCount/kEmitterCount)
            continue;

        emitter.delay -= kDt*emitDelay;
        if (emitter.delay > 0)
            continue;

        size_t steps = emitter.size / (2*kParticleRadius);

        for (size_t i=0; i<=steps && particleCount<kParticleCount; ++i)
        {
            Particle& pi = particles[particleCount];
            Material& material = particleMaterials[particleCount];
            ++particleCount;

            ++emitter.count;

            float ofs = (float)i / (float)steps - 0.5f;

            ofs *= emitter.size;
            pi.x = emitter.position.x - ofs*emitter.direction.y;
            pi.y = emitter.position.y + ofs*emitter.direction.x;
            pi.u = emitter.speed * emitter.direction.x*Random(0.9f, 1.1f);
            pi.v = emitter.speed * emitter.direction.y*Random(0.9f, 1.1f);
            pi.m = emitter.material.mass;

            material = emitter.material;
        }
    }

    emitDelay = 0;
}


void Update()
{
    for (size_t step=0; step<kSubSteps; ++step)
    {
        EmitParticles();

        ApplyBodyForces();
        Advance();
        UpdateGrid();
        CalculatePressure();
        CalculateRelaxedPositions();
        MoveToRelaxedPositions();
        UpdateGrid();
        ResolveCollisions();
    }

    glutPostRedisplay();
}


int main (int argc, char** argv)
{
    glutInitWindowSize(kScreenWidth, kScreenHeight);
    glutInit(&argc, argv);
    glutInitDisplayString(&quot;samples stencil>=3 rgb double depth&quot;);
    glutCreateWindow(&quot;SPH&quot;);
    glutDisplayFunc(Render);
    glutIdleFunc(Update);
    
    memset(particles, 0, kParticleCount*sizeof(Particle));
    UpdateGrid();

    glutMainLoop();
    
    return 0;
}
```

I'm pretty happy with the results, even if at three seconds per frame for the video above, my implementation isn't exactly fast. Here are a few other videos from various stages of development:

<div class="video-embed">
{%- include vimeo.html id=17281433 -%}
</div>

<div class="video-embed">
{%- include vimeo.html id=17357800 -%}
</div>

<div class="video-embed">
{%- include vimeo.html id=17629485 -%}
</div>


