// Sticky header toggle
const header = document.querySelector('.header');
const navSections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.navbar a');

// ── Mobile menu ──────────────────────────────────────────────────────────────
const menuBtn = document.querySelector('.menu-btn');
const navbar  = document.querySelector('.navbar');
const overlay = document.querySelector('.nav-overlay');

function openMenu() {
    navbar.classList.add('open');
    overlay.classList.add('show');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.querySelector('i').className = 'bx bx-x';
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    navbar.classList.remove('open');
    overlay.classList.remove('show');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.querySelector('i').className = 'bx bx-menu';
    document.body.style.overflow = '';
}

if (menuBtn && navbar && overlay) {
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navbar.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close on overlay click
    overlay.addEventListener('click', closeMenu);

    // Close when a nav link is clicked
    navbar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });
}
// ─────────────────────────────────────────────────────────────────────────────

function setActiveNav() {
    const scrollPosition = window.pageYOffset + 150;
    navLinks.forEach(link => link.classList.remove('active'));

    navSections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            const activeLink = document.querySelector(`.navbar a[href="#${sectionId}"]`);
            if (activeLink) activeLink.classList.add('active');
        }
    });
}

function handleScroll() {
    if (header) header.classList.toggle('sticky', window.scrollY >= 80);
    setActiveNav();
    toggleScrollTop();
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Scroll to top button
const scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-top-btn';
scrollTopBtn.innerHTML = '<i class="bx bx-up-arrow-alt"></i>';
document.body.appendChild(scrollTopBtn);

function toggleScrollTop() {
    if (window.scrollY > 500) {
        scrollTopBtn.classList.add('show');
    } else {
        scrollTopBtn.classList.remove('show');
    }
}

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', handleScroll);
window.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    toggleScrollTop();
});
