
const PRODUCTS_PER_PAGE = 9;

let products = [];
let currentPage = 1;

const grid = document.getElementById("productsGrid");
const pagination = document.getElementById("pagination");

async function loadProducts() {
    try {
        const response = await fetch("assets/data/Products.json");

        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        products = await response.json();

        document.getElementById("totalProducts").textContent =
            products.length;

        renderProducts();

    } catch (error) {
        grid.innerHTML = `
            <div class="products-loading">
                Unable to load products. Please try again.
            </div>
        `;

        console.error(error);
    }
}

function renderProducts() {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const end = start + PRODUCTS_PER_PAGE;

    const currentProducts = products.slice(start, end);

    grid.innerHTML = currentProducts.map((product, index) => `
        <article class="product-card"
                 tabindex="0"
                 role="button"
                 aria-label="View ${escapeHTML(product.name)}"
                 onclick="openProduct(${start + index})"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProduct(${start + index})}">

            <div class="product-image">

                <img
                    src="Images/Products/${encodeURIComponent(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                    onerror="this.style.opacity='0';"
                >

                <div class="product-hover">

                    <span>${escapeHTML(product.category)}</span>

                    <h3>${escapeHTML(product.name)}</h3>

                    <button type="button"
                            onclick="event.stopPropagation();openProduct(${start + index})">
                        VIEW DETAILS
                    </button>

                </div>

            </div>

            <div class="product-info">
                <h3>${escapeHTML(product.name)}</h3>
                <span>${escapeHTML(product.category)}</span>
            </div>

        </article>
    `).join("");

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

    if (totalPages <= 1) {
        pagination.innerHTML = "";
    } else {
        let html = `
            <button class="page-btn"
                    onclick="changePage(${currentPage - 1})"
                    ${currentPage === 1 ? "disabled" : ""}>
                &lsaquo;
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="page-btn ${i === currentPage ? "active" : ""}"
                        onclick="changePage(${i})"
                        ${i === currentPage ? 'aria-current="page"' : ""}>
                    ${i}
                </button>
            `;
        }

        html += `
            <button class="page-btn"
                    onclick="changePage(${currentPage + 1})"
                    ${currentPage === totalPages ? "disabled" : ""}>
                &rsaquo;
            </button>
        `;

        pagination.innerHTML = html;
    }

    const first = products.length
        ? (currentPage - 1) * PRODUCTS_PER_PAGE + 1 : 0;

    const last = Math.min(
        currentPage * PRODUCTS_PER_PAGE,
        products.length
    );

    document.getElementById("paginationInfo").textContent =
        `Showing ${first}-${last} of ${products.length} products`;
}

function changePage(page) {
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

    if (page < 1 || page > totalPages) return;

    currentPage = page;

    renderProducts();

    document.querySelector(".products-section")
        .scrollIntoView({ behavior: "smooth" });
}

function openProduct(index) {
    const product = products[index];

    if (!product) return;

    document.getElementById("modalImage").src =
        `Images/Products/${encodeURIComponent(product.image)}`;

    document.getElementById("modalImage").alt = product.name;

    document.getElementById("modalName").textContent =
        product.name;

    document.getElementById("modalCategory").textContent =
        product.category;

    document.getElementById("modalDescription").textContent =
        product.description;

    const features = document.getElementById("modalFeatures");

    features.replaceChildren();

    (product.features || []).forEach(feature => {
        const li = document.createElement("li");
        li.textContent = feature;
        features.appendChild(li);
    });

    document.getElementById("productOverlay")
        .classList.add("active");

    document.body.style.overflow = "hidden";

    document.getElementById("modalImage").src =
    `Images/Products/${encodeURIComponent(product.image)}`;

document.getElementById("modalImage").alt = product.name;

resetProductZoom();
}

function closeProduct() {
    document.getElementById("productOverlay")
        .classList.remove("active");

    document.body.style.overflow = "";

    resetProductZoom();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

document.getElementById("closeProduct")
    .addEventListener("click", closeProduct);

document.getElementById("productOverlay")
    .addEventListener("click", function (event) {
        if (event.target === this) {
            closeProduct();
        }
    });

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeProduct();
    }
});

loadProducts();



let zoomScale = 1;
let imageX = 0;
let imageY = 0;

let isDragging = false;
let startX = 0;
let startY = 0;

const modalImage = document.getElementById("modalImage");
const imageWrapper = document.getElementById("modalImageWrapper");

function updateZoom() {
    modalImage.style.transform =
        `translate(${imageX}px, ${imageY}px) scale(${zoomScale})`;

    modalImage.classList.toggle("zoomed", zoomScale > 1);
}

function zoomIn() {
    zoomScale = Math.min(zoomScale + 0.5, 4);
    updateZoom();
}

function zoomOut() {
    zoomScale = Math.max(zoomScale - 0.5, 1);

    if (zoomScale === 1) {
        imageX = 0;
        imageY = 0;
    }

    updateZoom();
}

function resetZoom() {
    zoomScale = 1;
    imageX = 0;
    imageY = 0;
    updateZoom();
}

// Click image to toggle zoom
modalImage.addEventListener("click", function () {
    if (zoomScale === 1) {
        zoomScale = 2;
    } else {
        resetZoom();
    }

    updateZoom();
});

// Mouse wheel zoom
imageWrapper.addEventListener("wheel", function (event) {
    event.preventDefault();

    if (event.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
}, { passive: false });

// Drag image with mouse
modalImage.addEventListener("mousedown", function (event) {
    if (zoomScale <= 1) return;

    isDragging = true;

    startX = event.clientX - imageX;
    startY = event.clientY - imageY;

    modalImage.classList.add("dragging");
});

document.addEventListener("mousemove", function (event) {
    if (!isDragging) return;

    imageX = event.clientX - startX;
    imageY = event.clientY - startY;

    updateZoom();
});

document.addEventListener("mouseup", function () {
    isDragging = false;
    modalImage.classList.remove("dragging");
});

// Reset zoom when modal opens
function resetProductZoom() {
    resetZoom();
}


async function toggleImageFullscreen(event) {
    event?.stopPropagation();

    const wrapper = document.getElementById("modalImageWrapper");

    try {
        if (!document.fullscreenElement) {
            await wrapper.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.error("Fullscreen error:", error);
    }
}

// Reset image zoom when entering or leaving fullscreen
document.addEventListener("fullscreenchange", function () {
    resetZoom();
});
