"""Simple script to import my old blog posts from WordPress.

This script is not comprehensive: several posts required manual clean up
after, but it did 90% of the work.
"""

import argparse
from datetime import datetime
import os
import re
import sys
import xml.etree.ElementTree as ET

def str2bool(v):
    if isinstance(v, bool):
       return v
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')

parser = argparse.ArgumentParser(description='Import WordPress eXtended RSS')
parser.add_argument('--src', type=str, required=True)
parser.add_argument('--dst', type=str, required=True)
parser.add_argument('--write_posts', type=str2bool, default=True)
parser.add_argument('--write_comments', type=str2bool, default=True)
args = parser.parse_args()


def get_output_path(date, title, ext):
    fn = title.lower().replace(' ', '-')
    for c in '\'!,?':
        fn = fn.replace(c, '')
    if fn in ['about', 'todo', 'hello-world']:
        return

    fn = datetime.strftime(date, '%Y-%m-%d') + '-' + fn + ext
    return os.path.join(args.dst, fn)


def write_post(item):
    title = item.find('title').text

    date_str = item.find('pubDate').text
    date = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S +0000')
    content = item.find('{http://purl.org/rss/1.0/modules/content/}encoded').text

    # Replace links
    def repl_link(m):
        return '[%s](%s)' % (m.group(2), m.group(1))
    content = re.sub(r'<a href="([^"]*)"[^>]*>([^<]*)</a>', repl_link, content)

    # Replace image links
    def repl_img(m):
        img_path = m.group(1).replace('http://imdoingitwrong.files.wordpress.com/', '/assets/imgs/')
        return '[![alt text](%s)](%s)' % (img_path, img_path)
    content = re.sub(r'<a href="([^"]*)"[^>]*><img[^>]*><\/a>', repl_img, content)

    # Replace code blocks links
    def repl_code(m):
        lang = m.group(2)
        if lang == 'text':
            lang = ''
        return '```%s\n' % lang
    content = re.sub(r'\[sourcecode.*lang(uage)?="([^"]*)"[^\]]*\]', repl_code, content)

    # Replace a few simple things
    replace = [
      ('&lt;', '<'),
      ('&gt;', '>'),
      ('&amp;', '&'),
      ('<strong>', '__'),
      ('</strong>', '__'),
      ('<em>', '_'),
      ('</em>', '_'),
      ('<i>', '_'),
      ('</i>', '_'),
      ('<blockquote>', '> '),
      ('</blockquote>', ''),
      ('[/sourcecode]', '```'),
    ]
    for o, n in replace:
        content = content.replace(o, n)

    path = get_output_path(date, title, '.md')
    print('writing %s' % path)
    with open(path, 'w') as f:
        print('---', file=f)
        print('layout: post', file=f)
        print('title: "%s"' % title, file=f)
        print('author: Tom Madams', file=f)
        print('---', file=f)
        print('', file=f)
        print(content, file=f)


def write_comments(item):
    date_str = item.find('pubDate').text
    post_date = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S +0000')
    title = item.find('title').text
    link = item.find('link').text

    comments = []
    for comment in item.findall('{http://wordpress.org/export/1.2/}comment'):
        t = comment.find('{http://wordpress.org/export/1.2/}comment_type').text
        if t == 'pingback':
            continue
        content = comment.find('{http://wordpress.org/export/1.2/}comment_content').text
        author = comment.find('{http://wordpress.org/export/1.2/}comment_author').text
        date_str = comment.find('{http://wordpress.org/export/1.2/}comment_date').text
        date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        url = comment.find('{http://wordpress.org/export/1.2/}comment_author_url').text
        if url:
            if url == 'http://imdoingitwrong.wordpress.com':
                url = 'https://tommadams.github.io/'
            author = '[%s](%s)' % (author, url)
        s = '\n--------\n\n_comment imported from [WordPress](%s)_\n%s said on %s:\n\n%s' % (link, author, date_str, content)
        comments.append((date, s))

    if comments:
        path = get_output_path(post_date, title, '-comments.txt')
        print('writing %s' % path)
        with open(path, 'w') as f:
            for date, comment in sorted(comments):
                print(comment, file=f)


tree = ET.parse(args.src)
rss = tree.getroot()
channel = rss.find('channel')
all_items = channel.findall('item')

items = []
for item in all_items:
    date_str = item.find('pubDate').text
    if date_str is None:
        continue

    content = item.find('{http://purl.org/rss/1.0/modules/content/}encoded').text
    if content is None:
        continue

    title = item.find('title').text
    if title in ('Hello, world!', 'About', 'TODO'):
        continue

    items.append(item)

if args.write_posts:
    for item in items:
        write_post(item)

if args.write_comments:
    for item in items:
        write_comments(item)
