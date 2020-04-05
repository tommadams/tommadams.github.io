---
layout: post
title:  Fast Poisson Disk Sampling
author: Tom Madams
gh_comment_id: 12
---

An implementation of [Fast Poisson Disk Sampling in Arbitrary Dimensions][paper]
by Robert Bridson.

The generated blue noise distribution is tileable.

{% raw %}

<style>
#canvas {
  border: 1px solid #000;
  border-radius: 4px;
  cursor: none;
}

input {
  width: 80px;
}

#demo {
  width: 512px;
  margin: 0 auto;
  text-align: right;
}

#clamp {
  color: #ccc;
  font-style: italic;
}

</style>

{% endraw %}

[paper]: https://www.cct.lsu.edu/~fharhad/ganbatte/siggraph2007/CD2/content/sketches/0250.pdf
