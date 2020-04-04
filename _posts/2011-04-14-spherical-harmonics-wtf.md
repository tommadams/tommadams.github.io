---
layout: post
title: "Spherical harmonics, WTF?"
author: Tom Madams
mathjax: true
gh_comment_id: 9
---

I never really "got" spherical harmonics, there was something about them that just didn't click for me. A little late to the party, I spent a few evenings recently reading over all the introductory papers I could find. Several times. This post is mostly just a brain dump, made in an effort to get everything straighted out in my head. I did stumble across a few curiosities though...

Real valued spherical harmonics can be defined as:
{% raw %}
$$Y^m_l(\theta, \phi) = \Phi^m(\phi) \, N^{|m|}_l \, P^{|m|}_l(cos\,\theta)$$
{% endraw %}

Where...<br>
$P^m_l$ are the [associated Legendre polynomials](http://mathworld.wolfram.com/AssociatedLegendrePolynomial.html):<br>
{% raw %}
$$P^0_0(x) = 1 \\
P^0_1(x) = x \\
P^1_1(x) = -\sqrt{1-x^2} \\
P^0_2(x) = \frac{1}{2}(3x^2-1) \\
P^1_2(x) = -3x\sqrt{1-x^2} \\
P^2_2(x) = 3(1-x^2)$$
{% endraw %}
[etc...](http://en.wikipedia.org/wiki/Associated_Legendre_polynomials#The_first_few_associated_Legendre_functions)

{% raw %}
$$\Phi^m(x) = \begin{cases}
\sqrt{2} cos(mx), & m > 0 \\
1, & m = 0 \\
\sqrt{2} sin(|m|x), & m < 0
\end{cases}$$
{% endraw %}

{% raw %}
$$N^m_l = \sqrt{ \frac{2l+1}{4\pi} \, \frac{(l-m)!}{(l+m)!}}$$
{% endraw %}

Assuming points on a unit sphere are defined in Cartesian coordinates as:
{% raw %}
$$x = sin\theta \, cos\phi \\
y = sin\theta \, sin\phi \\
z = cos\theta$$
{% endraw %}

Then the first three bands of the SH basis are simply:
{% raw %}
$$Y^0_0(\theta, \phi) = \sqrt{\frac{1}{4\pi}} \\
Y^{-1}_1(\theta, \phi) = -\sqrt{\frac{3}{4\pi}} y\\
Y^0_1(\theta, \phi) = \sqrt{\frac{3}{4\pi}} z \\
Y^1_1(\theta, \phi) = -\sqrt{\frac{3}{4\pi}} x \\
Y^{-2}_2(\theta, \phi) = \sqrt{\frac{15}{4\pi}} xy \\
Y^{-1}_2(\theta, \phi) = -\sqrt{\frac{15}{4\pi}} yz \\
Y^0_2(\theta, \phi) = \sqrt{\frac{5}{16\pi}} (3z^2-1) \\
Y^1_2(\theta, \phi) = -\sqrt{\frac{15}{4\pi}} zx \\
Y^2_2(\theta, \phi) = \sqrt{\frac{15}{16\pi}} (x^2-y^2) \\
$$
{% endraw %}

Note the change in sign of odd _m_ harmonics, which is consistent with the above definitions of _x_, _y_, _z_ and _P_. In many sources the basis function constants are all positive, which can be explained by assuming that they're defined using the [Condon-Shortley phase](http://mathworld.wolfram.com/Condon-ShortleyPhase.html). _That_ took me a while to figure out.

Projecting incident radiance _L_ into the SH basis is done using the following integral:
{% raw %}
$$L^m_l = \int^{2\pi}_0 \int^{\pi}_0 \, L(\theta, \phi) \, Y^m_l(\theta, \phi) \, sin(\theta) d\theta d\phi$$
{% endraw %}

This is actually a _spectacularly bad_ approximation for low numbers of SH bands. For example, here's Paul Debevec's [light probe](http://ict.debevec.org/~debevec/Probes/) of Grace cathedral:
[![alt text](/assets/imgs/2015/04/grace_probe_original.png)](/assets/imgs/2015/04/grace_probe_original.png)

And here's that same probe's projection into three SH bands (negative values have been clamped to zero):
[![alt text](/assets/imgs/2015/04/sh_projection1.png)](/assets/imgs/2015/04/sh_projection1.png)
Wow.

Fortunately, while spherical harmonics aren't generally good at representing _incident radiance_, they totally kick arse at representing _irradiance_. (Very roughly speaking, incident radiance is the the amount of light falling on a surface from a _particular_ direction, while irradiance is the total sum of light falling on a surface from _all_ directions.)

In SH form the conversion from radiance _L_ to irradiance _E_ is marvelously simple:
{% raw %}
$$E^m_l = \hat{A}_l \, L^m_l$$
{% endraw %}

The definition of _A_ isn't exactly straight forward, but luckily smart people have already done the hard work for us:
{% raw %}
$$\hat{A}_0 = 3.141593 \\
\hat{A}_1 = 2.094395 \\
\hat{A}_2 = 0.785398 \\
\hat{A}_3 = 0 \\
\hat{A}_4 = -0.130900 \\
\hat{A}_5 = 0 \\
\hat{A}_6 = 0.049087$$
{% endraw %}

The fact that terms after 2 fall off very quickly is what makes it possible to approximate irradiance fairly accurately with only three bands.

Given a set of spherical harmonic irradiance coefficients, the diffuse illumination for a particular direction is calculated by:
{% raw %}
$$E(\theta, \phi) = \sum_{l, m} \hat{A}_l \, L^m_l Y^m_l(\theta, \phi)$$
{% endraw %}

Condon-Shortley phase aside, something else that confused me were the results from [An Efficient Representation for Irradiance Environment Maps](http://www-graphics.stanford.edu/papers/envmap/). As far as I can tell, the gamma is not correct for some (possibly all) of the images in that paper, which made comparing results from my own code frustrating. The problems are compounded by the fact that the authors chose to apply some undefined tone mapping operator to some images, but not others.

Here's the Grace cathedral probe again, this time with an exposure of -2.5 stops:
[![alt text](/assets/imgs/2015/04/grace_probe.png)](/assets/imgs/2015/04/grace_probe.png)

Below is the result I got from performing a diffuse convolution of the probe using Monte Carlo integration and 1024 samples per pixel (I was too impatient to wait for a brute force convolution to finish). The exposure is set to -2.5 stops. It's very close to the result of applying a diffuse convolution in <a href="http://www.hdrshop.com/">HDR Shop<a />:
[![alt text](/assets/imgs/2015/04/grace_monte_carlo.png)](/assets/imgs/2015/04/grace_monte_carlo.png)

And here's the result of projecting the light probe into three SH bands and converting from the coefficients from radiance to irradiance. Again, the exposure is -2.5 stops. It's pretty close to the Monte Carlo result, which is reassuring:
[![alt text](/assets/imgs/2015/04/grace_sh.png)](/assets/imgs/2015/04/grace_sh.png)

Now, let's compare these results to the those from the irradiance environment maps paper. First, their brute force diffuse convolution:
[![alt text](/assets/imgs/2015/04/grace_ramamoorthi_diffuse.jpg)](/assets/imgs/2015/04/grace_ramamoorthi_diffuse.jpg)

And now their SH approximation:
[![alt text](/assets/imgs/2015/04/grace_ramamoorthi_sh.jpg)](/assets/imgs/2015/04/grace_ramamoorthi_sh.jpg)

My guess is that they either applied a gamma curve of 2.2 for some reason, or didn't correctly account for sRGB colour space when performing the HDR to LDR conversion. Or am I doing it wrong?

Here are the papers that I cribbed from:

Ramamoorthi & Hanrahan's paper that introduced SH to the rendering community: [An Efficient Representation for Irradiance Environment Maps](http://www-graphics.stanford.edu/papers/envmap/envmap.pdf)

Their earlier paper actually contains a more rigorous treatment of spherical harmonics: [On the relationship between radiance and irradiance: determining the illumination from images of a convex Lambertian object](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.24.568&rep=rep1&type=pdf)

Robin Green's great introduction to the topic: [Spherical Harmonic Lighting: The Gritty Details](http://www.research.scea.com/gdc2003/spherical-harmonic-lighting.pdf)

And Volker Schönefeld wrote my favourite introduction, the way he describes SH in terms of separate functions of theta and phi made everything fall into place: [Spherical Harmonics](http://heim.c-otto.de/~volker/prosem_paper.pdf)
