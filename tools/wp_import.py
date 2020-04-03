import argparse
from datetime import datetime
import os
import re
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description='Import WordPress eXtended RSS')
parser.add_argument('--src', type=str, required=True)
parser.add_argument('--dst', type=str, required=True)
args = parser.parse_args()

tree = ET.parse(args.src)
rss = tree.getroot()
channel = rss.find('channel')
items = channel.findall('item')
for item in items:
    title = item.find('title').text

    date_str = item.find('pubDate').text
    if date_str is None:
        continue
    date = datetime.strptime(date_str, '%a, %d %b %Y %H:%M:%S +0000')

    content = item.find('{http://purl.org/rss/1.0/modules/content/}encoded').text
    if content is None:
        continue

    fn = title.lower().replace(' ', '-')
    for c in '\'!,?':
        fn = fn.replace(c, '')
    if fn in ['about', 'todo', 'hello-world']:
        continue

    fn = datetime.strftime(date, '%Y-%m-%d') + '-' + fn + '.md'

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

    path = os.path.join(args.dst, fn)
    print('writing %s' % path)
    with open(path, 'w') as f:
        print('---', file=f)
        print('layout: post', file=f)
        print('title: "%s"' % title, file=f)
        print('author: Tom Madams', file=f)
        print('---', file=f)
        print('', file=f)
        print(content, file=f)
