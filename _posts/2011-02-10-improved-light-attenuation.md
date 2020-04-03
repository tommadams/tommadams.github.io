---
layout: post
title: "Improved light attenuation"
author: Tom Madams
---

In my [previous post](http://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/), I talked about the attenuation curve for a spherical light source:
$latex f_{att} = \frac{1}{(\frac{d}{r} + 1)^2} &s=2$

I had suggested applying a scale and bias to the result in order to limit a light's influence, which is a serviceable solution, but far from ideal. Unfortunately, applying such a bias causes the gradient of the curve to become non-zero at limit of the light's influence.

Here's the attenuation curve for a light of radius 1.0:
[![alt text](/assets/imgs/2011/02/attenuation_curve_unbiased.png)](/assets/imgs/2011/02/attenuation_curve_unbiased.png)

And after applying a scale and bias (shown in red):
[![alt text](/assets/imgs/2011/02/attenuation_curve_bias.png)](/assets/imgs/2011/02/attenuation_curve_bias.png)

You can see that the gradient at the zero-crossing is close to, but not quite zero. This is problematic because the human eye is irritatingly sensitive to discontinuities in illumination gradients and we might easily end up with [Mach bands](http://en.wikipedia.org/wiki/Mach_bands).

I was discussing this problem with a colleague of mine, Jerome Scholler, and he came up with an excellent suggestion - to transform _d_ in the attenuation equation by some function whose value tends to infinity as its input reaches our desired maximum distance of influence. My first thought was of using tan:
$latex d' = 2.1tan(\frac{\pi d}{2d_{max}}) &s=1$
$latex f_{att} = \frac{1}{(\frac{d'}{r} + 1)^2} &s=2$
[![alt text](/assets/imgs/2011/02/attenuation_curve_tan2.png)](/assets/imgs/2011/02/attenuation_curve_tan2.png)

That worked well, the resulting curve has roughly the same shape as the original, while also having both a gradient and value of zero at the desired maximum distance. It does have the disadvantage of using a trig function, which isn't so hot, so we went looking for something else. After a few minutes playing around we came up with the following rational function:
$latex d' = \frac{d}{1-(\frac{d}{d_{max}})^2} &s=2$
$latex f_{att} = \frac{1}{(\frac{d'}{r} + 1)^2} &s=2$
[![alt text](/assets/imgs/2011/02/attenuation_curve_final2.png)](/assets/imgs/2011/02/attenuation_curve_final2.png)

It's very similar to the tan version, but may run faster, depending on your hardware.

Below are some examples of the different methods, using a light with high intensity and small influence. On the left of each is the original image, on the right is the result of a levels adjustment, which emphasizes the tail of the attenuation curve.

<span style="color:#999999;">Disclaimer: The parameters for the analytic functions were chosen to highlight their different characteristics, not to look good.</span>

Original ray traced reference:
[![alt text](/assets/imgs/2011/02/attenuation2_original1.png)](/assets/imgs/2011/02/attenuation2_original1.png)

Analytic scale and bias:
[![alt text](/assets/imgs/2011/02/attenuation2_bias1.png)](/assets/imgs/2011/02/attenuation2_bias1.png)

Analytic tan:
[![alt text](/assets/imgs/2011/02/attenuation2_tan1.png)](/assets/imgs/2011/02/attenuation2_tan1.png)

Analytic rational:
[![alt text](/assets/imgs/2011/02/attenuation2_final1.png)](/assets/imgs/2011/02/attenuation2_final1.png)

The graphs today were brought to you courtesy of the awesome [fooplot.com](http://fooplot.com).
