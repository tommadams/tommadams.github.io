---
layout: post
title: "Light attenuation"
author: Tom Madams
mathjax: true
---

The canonical equation for point light attenuation goes something like this:

{% raw %}
$$f_{att} = \frac{1}{k_c + k_ld + k_qd^2}$$
{% endraw %}
where:<br>
_d_ = distance between the light and the surface being shaded<br>
_kc_ = constant attenuation factor<br>
_kl_ = linear attenuation factor<br>
_kq_ = quadratic attenuation factor<br>

Since I first read about light attenuation in the [Red Book](http://www.opengl.org/documentation/red_book/) I've often wondered where this equation came from and what values should actually be used for the attenuation factors, but I could never find a satisfactory explanation. Pretty much every reference to light attenuation in both books and online simply presents some variant of this equation, along with screenshots of objects being lit by lights with different attenuation factors. If you're lucky, there's sometimes an accompanying bit of handwaving.

Today, I did some experimentation with my path tracer and was pleasantly surprised to find a correlation between the direct illumination from a physically based spherical area light source and the point light attenuation equation.

I set up a simple scene in which to conduct the tests: a spherical area light above a diffuse plane. By setting the light's radius and distance above the plane to different values and then sampling the direct illumination at a point on the plane directly below the light, I built up a table of attenuation values. Here's a plot of a some of the results; the distance on the horizontal axis is that between the plane and the light's _surface_, not its centre.
[![alt text](/assets/imgs/2012/01/light_attenuation_curves_2.png)](/assets/imgs/2012/01/light_attenuation_curves_2.png)

After looking at the results from a series of tests, it became apparent that the attenuation of a spherical light can be modeled as:<br>
{% raw %}
$$f_{att} = \frac{1}{(\frac{d}{r} + 1)^2}$$<br>
{% endraw %}
where:<br>
d = distance between the light's surface and the point being shaded<br>
r = the light's radius<br>

Expanding this out, we get:<br>
{% raw %}
$$f_{att} = \frac{1}{1 + \frac{2}{r}d + \frac{1}{r^2}d^2}$$<br>
which is the original point light attenuation equation with the following attenuation factors:<br>
$$k_c = 1 \\
k_l = \frac{2}{r} \\
k_q = \frac{1}{r^2}$$
{% endraw %}

Below are a couple of renders of four lights above a plane. The first is a ground-truth render of direct illumination calculated using Monte Carlo integration:
[![alt text](/assets/imgs/2012/01/light_attenuation_montecarlo.png)](/assets/imgs/2012/01/light_attenuation_montecarlo.png)

In this second render, direct illumination is calculated analytically using the attenuation factors derived from the light radius:
[![alt text](/assets/imgs/2012/01/light_attenuation_analytical.png)](/assets/imgs/2012/01/light_attenuation_analytical.png)

The only noticeable difference between the two is that in the second image, an area of the plane to the far left is slightly too bright due to a lack of a shadowing term.

Maybe this is old news to many people, but I was pretty happy to find out that an equation that had seemed fairly arbitrary to me for so many years actually had some physical motivation behind it. I don't really understand why this relationship is never pointed out, not even in [Foley and van Dam's](http://www.amazon.com/Computer-Graphics-Principles-Practice-2nd/dp/0201848406) venerable tome*.

Unfortunately this attenuation model is still problematic for real-time rendering, since a light's influence is essentially unbounded. We can, however, artificially enforce a finite influence by clipping all contributions that fall below a certain threshold. Given a spherical light of radius _r_ and intensity _Li_, the illumination _I_ at distance _d_ is:<br>
{% raw %}
$$I = \frac{L_i}{(\frac{d}{r} + 1)^2}$$
{% endraw %}

Assuming we want to ignore all illumination that falls below some cutoff threshold _Ic_, we can solve for _d_ to find the maximum distance of the light's influence:<br>
{% raw %}
$$d_{max} = r(\sqrt{\frac{L_i}{I_c}}-1)$$<br>
{% endraw %}

Biasing the calculated illumination by _-Ic_ and then scaling by _1/(1-Ic)_ ensures that illumination drops to zero at the furthest extent, and the maximum illumination is unchanged.

Here's the result of applying these changes with a cutoff threshold of 0.001; in the second image, areas which receive no illumination are highlighted in red:
[![alt text](/assets/imgs/2012/01/light_attenuation_cutoff_0_1.png)](/assets/imgs/2012/01/light_attenuation_cutoff_0_1.png)

[![alt text](/assets/imgs/2012/01/light_attenuation_cutoff_0_1_range.png)](/assets/imgs/2012/01/light_attenuation_cutoff_0_1_range.png)

And here's a cutoff threshold of 0.005; if you compare to the version with no cutoff, you'll see that the illumination is now noticeably darker:
[![alt text](/assets/imgs/2012/01/light_attenuation_cutoff_0_5.png)](/assets/imgs/2012/01/light_attenuation_cutoff_0_5.png)

[![alt text](/assets/imgs/2012/01/light_attenuation_cutoff_0_5_range.png)](/assets/imgs/2012/01/light_attenuation_cutoff_0_5_range.png)

Just to round things off, here's a GLSL snippet for calculating the approximate direct illumination from a spherical light source. Soft shadows are left as an exercise for the reader.
;)
```cpp

vec3 DirectIllumination(vec3 P, vec3 N, vec3 lightCentre, float lightRadius, vec3 lightColour, float cutoff)
{
    // calculate normalized light vector and distance to sphere light surface
    float r = lightRadius;
    vec3 L = lightCentre - P;
    float distance = length(L);
    float d = max(distance - r, 0);
    L /= distance;

    // calculate basic attenuation
    float denom = d/r + 1;
    float attenuation = 1 / (denom*denom);

    // scale and bias attenuation such that:
    //   attenuation == 0 at extent of max influence
    //   attenuation == 1 when d == 0
    attenuation = (attenuation - cutoff) / (1 - cutoff);
    attenuation = max(attenuation, 0);

    float dot = max(dot(L, N), 0);
    return lightColour * dot * attenuation;
}
```

<span style="color:#999999;">* I always felt a little sorry for Feiner and Hughes.</span>
