async function showComments(repo, commentId, pageId) {
  // Fetch comments from GitHub.
  let url = `https://api.github.com/repos/${repo}/issues/${commentId}/comments?page=${pageId}`;
  let response = await fetch(url, {
    headers: {'Accept': 'application/vnd.github.v3.html+json'},
  });

  let commentList = document.getElementById('gh-comment-list');
  if (response.status != 200) {
    commentList.append('Comments are not open for this post yet.');
    return;
  }

  // Parse JSON.
  let comments = await response.json();

  // Generate comment elements.
  for (let comment of comments) {
    let date = new Date(comment.created_at);
    let elem = document.createElement('div');
    elem.className = 'gh-comment';
    elem.innerHTML = `
<img src="${comment.user.avatar_url}" width="24px">
<a href="${comment.user.html_url}">${comment.user.login}</a> posted at <em>${date.toUTCString()}</em>
<div class="gh-comment-hr"></div>
${comment.body_html}`
    commentList.appendChild(elem);
  }

  // Fetch the next page of comments, if any.
  let linksResponse = response.headers.get('Link');
  if (linksResponse) {
    let entries = linksResponse.split(',');
    for (let entry of entries) {
      if ('next' == entry.match(/rel="([^"]*)/)[1]) {
        showComments(repo, commentId, pageId+1);
        break;
      }
    }
  }
}

function fetchComments(repo, commentId) {
  document.addEventListener('DOMContentLoaded', () => {
    showComments(repo, commentId, 1).catch((e) => {
      console.log(e);
      let commentList = document.getElementById('gh-comment-list');
      commentList.append('Something went wrong fetching comments from GitHub');
    });
  });
}
