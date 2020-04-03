---
layout: post
title: "Fighting fireflies"
author: Tom Madams
---

I've been playing around with path tracing on and off for longer than I care to admit. Although my dalliances never produced anything earth-shattering (and certainly nothing I'd be willing to post about on [ompf](http://ompf.org/forum/)), I've found it to be an endlessly fascinating subject. No matter how much I read about it, I only ever seem to be scratching the surface.

One of the biggest headaches I encountered were caused by "fireflies": those bright pixels that can occur when a sampling a strong response combined with a small PDF somewhere along the path. For a long time, I was "fixing" these by hand painting over the offending pixels and pretending like nothing ever happened. Eventually though, the guilt of this gnawed away at me long enough to motivate finding some kind of better solution.

My first thought was to write a filter that estimated variance in an image and replace any "bad" pixels it found with a weighted average of their neighbours. Luckily, my second thought was of [shadow maps](http://www.punkuser.net/vsm/), the only other context in which I'd read about variance before. Based on the ideas in that paper, I accumulate two separate per-pixel buffers: one storing the running sum of the samples and the other storing the sum of their squares. Having these two buffers then makes it trivial to compute the sample variance of each pixel in the image.

My path tracer already had support for progressive refinement, so it was straightforward to add a separate "variance reduction" pass that would run at the touch of a button. During this pass, the N pixels with the highest variance are identified and oversampled a few hundred times, which hopefully reduces their variance sufficiently. If not, I just run the pass again.

As an example, here's a render of the Manifold mesh from Torolf Sauermann's awesome [model repository](http://forum.jotero.com/viewtopic.php?t=3&sid=6722b3a1bc2733ea416304d6af6e3a2b), stopped after only a few paths have been traced per pixel:
[![alt text](/assets/imgs/2010/12/before_reduction_tagged1.png)](/assets/imgs/2010/12/before_reduction_tagged1.png)

I've highlighted a few areas that contain fireflies and below is a comparison of those areas before and after running the variance reduction pass:
[![alt text](/assets/imgs/2010/12/reduction_comparison2.png)](/assets/imgs/2010/12/reduction_comparison2.png)

And here's the complete result of running the pass; it's still noisy, but the pixels with particularly high variance have been cleaned up reasonably well:
[![alt text](/assets/imgs/2010/12/after_reduction2.png)](/assets/imgs/2010/12/after_reduction2.png)

I'm not too hot at statistics, but I would guess that this adds bias to the final result, which is frowned upon in some circles (but not [others](http://www.mentalimages.com/products/iray)). Admittedly, a better solution would be to simply not generate so much variance in the first place, but this will do as a kludge until then. At least it's better than painting pixels by hand!

Ok, since this post was mostly just an excuse to dump some results from my path tracer, here they are.

The XYZ RGB Dragon from Stanford's [3D Scanning Repository](http://www.graphics.stanford.edu/data/3Dscanrep/):
[![alt text](/assets/imgs/2010/12/xyzrgb_dragon.png)](/assets/imgs/2010/12/xyzrgb_dragon.png)

A heat map of the [BIH](http://en.wikipedia.org/wiki/Bounding_interval_hierarchy) built for the same model.
[![alt text](/assets/imgs/2010/12/bih.png)](/assets/imgs/2010/12/bih.png)

The _other_ Dragon from [Stanford](http://www.graphics.stanford.edu/data/3Dscanrep/):
[![alt text](/assets/imgs/2010/12/dragon.png)](/assets/imgs/2010/12/dragon.png)

Manifold again, from [jotero.com](http://forum.jotero.com/viewtopic.php?t=3&sid=6722b3a1bc2733ea416304d6af6e3a2b).
[![alt text](/assets/imgs/2010/12/manifold.png)](/assets/imgs/2010/12/manifold.png)

Some [Stanford](http://www.graphics.stanford.edu/data/3Dscanrep/) Bunnies:
[![alt text](/assets/imgs/2010/12/bunnies.jpg)](/assets/imgs/2010/12/bunnies.jpg)

[Crytek's](http://www.crytek.com/cryengine/cryengine3/downloads) updated version of Marko Dabrovic's Sponza model:
[![alt text](/assets/imgs/2010/12/sponza.png)](/assets/imgs/2010/12/sponza.png)

And [Stanford's](http://www.graphics.stanford.edu/data/3Dscanrep/) Lucy, just to prove that I can:
[![alt text](/assets/imgs/2010/12/lucy2.png)](/assets/imgs/2010/12/lucy2.png)I've not been able to find any close up renders of Lucy to compare with, but I believe that the "pimples" on the model are noise in the original dataset.
