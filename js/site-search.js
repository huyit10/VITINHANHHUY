(function () {
    var catalog = window.VTH_Catalog;
    if (!catalog) return;

    function searchUrl(q) {
        return 'tim-kiem.html?q=' + encodeURIComponent(q);
    }

    document.querySelectorAll('.header-search').forEach(function (box) {
        var input = box.querySelector('input[type="text"]');
        var btn = box.querySelector('button');
        if (!input) return;

        function goSearch() {
            var q = (input.value || '').trim();
            if (!q) {
                input.focus();
                return;
            }
            window.location.href = searchUrl(q);
        }

        if (btn) btn.addEventListener('click', goSearch);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                goSearch();
            }
        });
    });

    document.querySelectorAll('.sidebar-list > li').forEach(function (li) {
        var labelEl = li.querySelector('.sidebar-label');
        var text = labelEl
            ? labelEl.textContent.trim()
            : li.textContent.replace(/›/g, '').trim();

        if (!text || li.closest('.sidebar-submenu')) return;

        if (li.classList.contains('has-submenu')) {
            if (labelEl) {
                labelEl.style.cursor = 'pointer';
                labelEl.addEventListener('click', function (e) {
                    e.stopPropagation();
                    window.location.href = searchUrl(text);
                });
            }
            li.querySelectorAll('.sidebar-submenu li').forEach(function (subLi) {
                subLi.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var subText = subLi.textContent.trim();
                    if (subText) window.location.href = searchUrl(subText);
                });
            });
        } else {
            li.addEventListener('click', function () {
                window.location.href = searchUrl(text);
            });
        }
    });

    document.querySelectorAll('.shop-cat-list a.shop-cat-link').forEach(function (link) {
        if (link.getAttribute('href') && link.getAttribute('href').indexOf('tim-kiem.html') === 0) return;
        var text = link.textContent.replace(/▼/g, '').trim();
        if (text) link.setAttribute('href', searchUrl(text));
    });

    if (!document.body.classList.contains('page-search')) return;

    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();
    var page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
    var sortMode = params.get('sort') || 'relevance';

    var breadcrumbEl = document.getElementById('searchBreadcrumbCurrent');
    var resultCountEl = document.getElementById('searchResultCount');
    var gridEl = document.getElementById('searchGrid');
    var emptyEl = document.getElementById('searchEmpty');
    var paginationEl = document.getElementById('searchPagination');
    var sortSelect = document.getElementById('searchSort');
    var priceRange = document.getElementById('searchPriceRange');
    var priceLabel = document.getElementById('searchPriceLabel');
    var priceHint = document.getElementById('searchPriceHint');
    var btnFilter = document.getElementById('searchBtnFilter');
    var headerInput = document.querySelector('.header-search input[type="text"]');

    if (headerInput && query) headerInput.value = query;

    if (breadcrumbEl) {
        breadcrumbEl.textContent = query
            ? 'Kết quả tìm kiếm cho "' + query + '"'
            : 'Kết quả tìm kiếm';
    }

    document.title = (query ? 'Tìm kiếm: ' + query : 'Tìm kiếm') + ' | Vi Tính Anh Huy';

    var allResults = query ? catalog.search(query) : [];
    var maxPrice = 0;
    allResults.forEach(function (p) {
        if (p.price > maxPrice) maxPrice = p.price;
    });
    if (!maxPrice) maxPrice = 30000000;

    var filtered = allResults.slice();
    var priceMaxFilter = maxPrice;

    function formatPrice(n) {
        return catalog.formatPrice(n);
    }

    function pageUrl(p, sort) {
        var u = new URLSearchParams();
        if (query) u.set('q', query);
        if (p > 1) u.set('page', String(p));
        if (sort && sort !== 'relevance') u.set('sort', sort);
        var qs = u.toString();
        return 'tim-kiem.html' + (qs ? '?' + qs : '');
    }

    function updatePriceUI() {
        if (!priceRange || !priceLabel) return;
        var val = Math.round((priceRange.value / 100) * maxPrice);
        priceMaxFilter = val;
        priceLabel.textContent = formatPrice(val);
        if (priceHint) priceHint.innerHTML = 'Giá: <strong>0 ₫ – ' + formatPrice(val) + '</strong>';
    }

    function getFiltered() {
        return filtered.filter(function (p) { return p.price <= priceMaxFilter; });
    }

    function render() {
        var items = catalog.sortProducts(getFiltered(), sortMode);
        var total = items.length;
        var perPage = catalog.PER_PAGE;
        var totalPages = Math.max(1, Math.ceil(total / perPage));
        if (page > totalPages) page = totalPages;

        var start = total ? (page - 1) * perPage + 1 : 0;
        var end = Math.min(page * perPage, total);
        var pageItems = items.slice((page - 1) * perPage, page * perPage);

        if (resultCountEl) {
            resultCountEl.textContent = total
                ? 'Hiển thị ' + start + '–' + end + ' của ' + total + ' kết quả'
                : 'Không có kết quả';
        }

        if (gridEl) {
            gridEl.innerHTML = pageItems.map(function (p) { return catalog.renderCard(p); }).join('');
            gridEl.style.display = total ? '' : 'none';
        }
        if (emptyEl) emptyEl.hidden = !!total;

        if (paginationEl) {
            if (totalPages <= 1) {
                paginationEl.innerHTML = '';
                paginationEl.hidden = true;
            } else {
                paginationEl.hidden = false;
                var html = '';
                html += page > 1
                    ? '<a href="' + pageUrl(page - 1, sortMode) + '" class="shop-page-btn">‹</a>'
                    : '<span class="shop-page-btn disabled">‹</span>';
                for (var i = 1; i <= totalPages; i++) {
                    html += i === page
                        ? '<span class="shop-page-btn active" aria-current="page">' + i + '</span>'
                        : '<a href="' + pageUrl(i, sortMode) + '" class="shop-page-btn">' + i + '</a>';
                }
                html += page < totalPages
                    ? '<a href="' + pageUrl(page + 1, sortMode) + '" class="shop-page-btn">›</a>'
                    : '<span class="shop-page-btn disabled">›</span>';
                paginationEl.innerHTML = html;
            }
        }
    }

    if (sortSelect) {
        sortSelect.value = sortMode;
        sortSelect.addEventListener('change', function () {
            window.location.href = pageUrl(1, sortSelect.value);
        });
    }

    if (priceRange) {
        priceRange.addEventListener('input', updatePriceUI);
        updatePriceUI();
    }

    if (btnFilter) {
        btnFilter.addEventListener('click', function () {
            page = 1;
            render();
        });
    }

    filtered = allResults;
    render();
})();
