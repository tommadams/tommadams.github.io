---
layout: post
title: "Realtime global illumination"
author: Tom Madams
---

I've had an idea floating around in my head for several months now, but evening classes, a hard drive failure, then a GPU failure prevented me from doing much about it until this weekend. First, a couple of screenshots of what I'll be talking about.

__Cornell box, I choose you!__

[![alt text](/assets/imgs/2011/04/gi1.png)](/assets/imgs/2011/04/gi1.png)

[![alt text](/assets/imgs/2011/04/gi2.png)](/assets/imgs/2011/04/gi2.png)

The above screenshots are of real-time single-bounce GI in a static scene with fully dynamic lighting. There are 7182 patches, and the lighting calculations take 36ms per frame on one thread of an Intel Core 2 @2.4 GHz. The code is not optimized.

The basic idea is simple and is split into two phases.

A one-time scene compilation phase:
 - Split all surfaces in the scene into roughly equal sized patches.
 - For each patch _i_, build a list of all other patches visible from _i_ along with the form factor between patches _i_ and _j_:
          $latex F_{ij} = \frac{cos \phi_i \, cos \phi_j}{\pi \, |r|^2} \, A_j &s=2$
          where:<br>
          _F<sub>ij</sub>_ is the form factor between patches _i_ and _j_<br>
          _A<sub>j</sub>_ is the area of patch _j_<br>
          _r_ is the vector from _i_ to _j_<br>
          _&Phi;<sub>i</sub>_ is the angle between _r_ and the normal of patch _i_<br>
          _&Phi;<sub>j</sub>_ is the angle between _r_ and the normal of patch _j_<br>

And a per-frame lighting phase:
 - For each patch _i_, calculate the direct illumination.
 - For each patch _i_, calculate single-bounce indirect illumination from all visible patches:
        $latex I_i = \sum_j D_j \, F_{ij} &s=1$
        where:<br>
        _I<sub>j</sub>_ is the single-bounce indirect illumination for patch _i_<br>
        _D<sub>j</sub>_ is the direct illumination for patch _j_<br>

So far, so [radiosity](http://freespace.virgin.net/hugo.elias/radiosity/radiosity.htm). If I understand Michal Iwanicki's [GDC presentation](http://miciwan.com/GDC2011/GDC2011_Mega_Meshes.pdf) correctly, this is similar to the lighting tech on Milo and Kate, only they additionally project the bounce lighting into SH.

The problem with this approach is that the running time is O(N<sup>2</sup>) with the number of patches. We could work around this by making the patches quite large, running on the GPU, or both. Alternatively, we can bring the running time down to O(N.log(N)) by borrowing from Michael Bunnell's work on [dynamic AO](http://http.download.nvidia.com/developer/GPU_Gems_2/GPU_Gems2_ch14.pdf) and cluster patches into a hierarchy. I chose to perform bottom-up patch clustering similarly to the method that Miles Macklin describes in his [(Almost) realtime GI](http://mmack.wordpress.com/2009/01/21/almost-realtime-gi/) blog post.

Scene compilation is now:
 - Split all surfaces in the scene into roughly equal sized patches.
 - Build a hierarchy of patches using [k-means clustering](http://en.wikipedia.org/wiki/K-means_clustering).
 - For each patch _i_, build a list of all other patches visible from _i_ along with the form factor between patches _i_ and _j_. If a visible patch _j_ is too far from patch _i_ look further up the hierarchy.

And the lighting phase:
 - For each leaf patch _i_ in the hierarchy, calculate the direct illumination.
 - Propagate the direct lighting up the hierarchy.
 - For each patch _i_, calculate single-bounce indirect illumination from all visible patches clusters.

Although this technique is really simple, it supports a feature set similar to that of [Enlighten](http://www.geomerics.com/enlighten/):
 - Global illumination reacts to changes in surface albedo.
 - Static area light sources that cast soft shadows.

That's basically about it. There are a few of other areas I'm tempted to look into once I've cleaned the code up a bit:
 - Calculate directly and indirect illumination at different frequencies. This would allow scaling to much larger scenes.
 - Perform the last two lighting steps multiple times to approximate more light bounces.
 - Project the indirect illumination into SH, HL2 or the Half-Life basis.
 - Light probes for dynamic objects.

You can grab the source code from [here](http://code.google.com/p/imdoingitwrong/source/browse/#hg%2FGi%2FGi). Expect a mess, since it's a C++ port of a C# proof of concept with liberal use of vector and hash_map. Scene construction is particularly bad and may take a minute to run. You can fly around using WASD and left-click dragging with the mouse.
