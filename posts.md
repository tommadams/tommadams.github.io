---
layout: default
title: Posts
permalink: /posts/
---

# {{ page.title }}

{% for post in site.posts %}
  - ## [{{ post.title }}]({{ post.url }})
    {{ post.excerpt }}
{% endfor %}
