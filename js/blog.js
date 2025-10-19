const POSTS_PER_PAGE = 9999;
let posts = [];
let filtered = [];
let currentPage = 1;
let categories = new Set();

function formatDate(d) {
    return new Date(d).toLocaleDateString();
}

async function fetchPosts() {
    try {
        const res = await fetch("posts/posts.json");
        posts = await res.json();
        // Ensure image exists or extract first image from HTML post file
        await Promise.all(
            posts.map(async (post) => {
                if (!post.image) {
                    try {
                        const html = await (await fetch(post.file)).text();
                        const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
                        post.image = m ? m[1].replace("..", ".") : "images/post1-feature.jpg";
                    } catch (e) {
                        post.image = "images/post1-feature.jpg";
                    }
                }
                (post.categories || []).forEach((c) => categories.add(c));
            })
        );
        filtered = posts.slice();
        renderCategories();
        render();
    } catch (e) {
        document.getElementById("posts").innerHTML = "<p>Failed to load posts.</p>";
        console.error(e);
    }
}

function renderCategories() {
    const container = document.getElementById("categoryButtons");
    container.innerHTML = "";
    const allBtn = document.createElement("button");
    allBtn.textContent = "All";
    allBtn.classList.add("active");
    allBtn.onclick = () => {
        filtered = posts.slice();
        currentPage = 1;
        updateActiveCategory(null);
        render();
    };
    container.appendChild(allBtn);

    Array.from(categories)
        .sort()
        .forEach((cat) => {
            const btn = document.createElement("button");
            btn.textContent = cat;
            btn.onclick = () => {
                filtered = posts.filter((p) => (p.categories || []).includes(cat));
                currentPage = 1;
                updateActiveCategory(cat);
                render();
            };
            container.appendChild(btn);
        });
}

function updateActiveCategory(cat) {
    const buttons = document.querySelectorAll("#categoryButtons button");
    buttons.forEach((b) => {
        if (b.textContent === cat || (cat === null && b.textContent === "All")) b.classList.add("active");
        else b.classList.remove("active");
    });
}

function render() {
    const container = document.getElementById("posts");
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const pagePosts = filtered.slice(start, start + POSTS_PER_PAGE);
    container.innerHTML =
        pagePosts
            .map(
                (p) => `
    <article class="post-card">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="post-card-content">
        <h3><a href="post.html?id=${p.id}">${p.title}</a></h3>
        <div class="meta">${formatDate(p.date)} • ${(p.categories || []).join(", ")}</div>
        <div class="excerpt">${p.description}</div>
        <div class="card-footer">
          <a class="read-more" href="post.html?id=${p.id}">Read More →</a>
          <div style="font-size:0.9rem;color:#888;">${p.readTime || ""}</div>
        </div>
      </div>
    </article>`
            )
            .join("") || "<p>No posts found.</p>";

    renderPagination();
}

function renderPagination() {
    const total = Math.ceil(filtered.length / POSTS_PER_PAGE);
    const container = document.getElementById("pagination");
    container.innerHTML = "";
    if (total <= 1) return;
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = "page-btn" + (i === currentPage ? " active" : "");
        btn.onclick = () => {
            currentPage = i;
            render();
        };
        container.appendChild(btn);
    }
}

document.getElementById("search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    filtered = posts.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
    );
    currentPage = 1;
    render();
});

fetchPosts();
