---
layout: default
title: Posts
permalink: /posts/
---

# {{ page.title }}

{% for post in site.posts %}
  - ## [{{ post.date | date_to_string }} - {{  post.title }}]({{ post.url }})
    {{ post.excerpt }}
{% endfor %}
