// Zorg dat lucide niet alles breekt als de CDN offline is
if (typeof window !== 'undefined' && typeof window.lucide === 'undefined') {
    window.lucide = { createIcons: function() {} };
}
try { lucide.createIcons(); } catch (e) {}

// Basisinteractie
document.addEventListener('DOMContentLoaded', function() {
    // Tabbladen wisselen
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Anoniem-schakelaar (veilig binden als element bestaat)
    const anonymousToggle = document.getElementById('anonymous-mode');
    if (anonymousToggle) {
        anonymousToggle.addEventListener('change', function() {
            console.log('Anonymous mode:', this.checked);
        });
    }

    // Post-acties
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Laat de feed-eigen handlers het afhandelen
            if (btn.closest('#postsFeed')) return;
            e.preventDefault();
            if (btn.querySelector('[data-lucide]')?.getAttribute('data-lucide') === 'heart') {
                btn.classList.toggle('liked');
            } else if (btn.querySelector('[data-lucide]')?.getAttribute('data-lucide') === 'bookmark') {
                btn.classList.toggle('bookmarked');
            }
        });
    });

    // Profieldropdown
    const trigger = document.getElementById('profileTrigger');
    const dropdown = document.getElementById('profileDropdown');
    const menu = document.getElementById('profileMenu');

    function closeDropdown() {
        dropdown.classList.remove('open');
        trigger?.setAttribute('aria-expanded', 'false');
        dropdown?.setAttribute('aria-hidden', 'true');
    }

    function openDropdown() {
        dropdown.classList.add('open');
        trigger?.setAttribute('aria-expanded', 'true');
        dropdown?.setAttribute('aria-hidden', 'false');
    }

    if (trigger && dropdown) {
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            if (dropdown.classList.contains('open')) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });
        // Toetsenbordtoegang (Enter/Spatie)
        trigger.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDropdown();
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (menu && !menu.contains(e.target)) {
            closeDropdown();
        }
    });
    // Sluit met Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    // Profielgegevens synchroniseren met UI
    try {
        const profile = JSON.parse(localStorage.getItem('interestLinkProfile') || 'null');
        if (profile && profile.name) {
            const initials = profile.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
            const nameEl = document.querySelector('.profile-name');
            const subEl = document.querySelector('.profile-sub');
            const badgeEl = document.querySelector('.profile-badge');
            const initialsEl = document.querySelector('.profile-initials');
            if (nameEl) nameEl.textContent = profile.name;
            if (subEl) subEl.textContent = `Jaar ${profile.year} - ${profile.class}`;
            if (badgeEl) badgeEl.textContent = initials;
            if (initialsEl) initialsEl.textContent = initials;

            // Ook de profielmodal bijwerken
            const pcAvatar = document.querySelector('.pc-avatar');
            const pcName = document.querySelector('.pc-name');
            const pcSub = document.querySelector('.pc-sub');
            if (pcAvatar) pcAvatar.textContent = initials;
            if (pcName) pcName.textContent = profile.name;
            if (pcSub) {
                pcSub.innerHTML = '<i data-lucide="graduation-cap"></i><span>Jaar ' + profile.year + '</span><i data-lucide="map-pin"></i><span>' + profile.class + '</span>';
                try { lucide.createIcons(); } catch (e) {}
            }
        }
    } catch (e) {}

    // Dropdown item-afhandelaars
    if (menu) menu.addEventListener('click', function(e) {
        const target = e.target.closest('.profile-item');
        if (!target) return;
        e.preventDefault();
        const action = target.getAttribute('data-action');
        if (action === 'logout') {
            localStorage.removeItem('interestLinkProfile');
            window.location.href = 'index.html';
        }
        closeDropdown();
    });

    // Profielmodal-logica
    const profileModal = document.getElementById('profileModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCloseFooter = document.getElementById('modalCloseFooter');
    const STORAGE_KEYS = { interests: 'interestlink.interests', bio: 'interestlink.bio', communities: 'interestlink.communities' };
    function openProfileModal() {
        profileModal.classList.add('open');
        profileModal.setAttribute('aria-hidden', 'false');
        // UI synchroniseren
        renderChips();
        renderCommunityChips();
        bioTextarea.value = currentBio || '';
    }
    function closeProfileModal() {
        profileModal.classList.remove('open');
        profileModal.setAttribute('aria-hidden', 'true');
    }
    window.openProfileModal = openProfileModal;
    modalCloseBtn.addEventListener('click', closeProfileModal);
    modalCloseFooter.addEventListener('click', closeProfileModal);
    profileModal.addEventListener('click', function(e) {
        if (e.target === profileModal) closeProfileModal();
    });

    // Bio-wissel
    const bioEditBtn = document.getElementById('bioEditBtn');
    const bioTextarea = document.getElementById('bioTextarea');
    let bioEditing = false;
    let currentBio = '';
    bioEditBtn.addEventListener('click', function() {
        bioEditing = !bioEditing;
        bioTextarea.disabled = !bioEditing;
        if (bioEditing) {
            bioTextarea.focus();
            this.querySelector('span').textContent = 'Opslaan';
        } else {
            this.querySelector('span').textContent = 'Bewerken';
            currentBio = bioTextarea.value.trim();
            try { localStorage.setItem(STORAGE_KEYS.bio, currentBio); } catch (e) {}
        }
    });

    // Elementen ophalen
    const addInterestBtn = document.getElementById('add-interest-btn');
    const overlay = document.getElementById('interest-overlay');
    const closeOverlay = document.getElementById('close-overlay');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveInterestBtn = document.getElementById('save-interest-btn');
    const searchInput = document.getElementById('interest-search');
    const interestsGrid = document.querySelector('.interests-grid');
    const selectedList = document.getElementById('selected-list');
    const selectionCount = document.getElementById('selection-count');
    // Extra elementen voor chips en counters (profile modal)
    const chipsContainer = document.getElementById('chips');
    const interestsCountEl = document.getElementById('interestsCount');
    const interestInput = document.getElementById('interestInput');
    const interestSuggestions = document.getElementById('interestSuggestions');
    const communityChips = document.getElementById('communityChips');
    const communitiesCountEl = document.getElementById('communitiesCount');
    const communityInput = document.getElementById('communityInput');
    const communitySuggestions = document.getElementById('communitySuggestions');
    // Sidebar-doelen om selecties op het dashboard te spiegelen
    const sidebarCommunityList = document.querySelector('.left-sidebar .community-list');
    const sidebarInterestsGrid = document.querySelector('.left-sidebar .interests-grid');
    let interests = [];
    let communities = [];
    const suggestions = [
        'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Svelte', 'Node.js', 'Python', 'Django',
        'Flask', 'Java', 'C#', 'C++', 'Go', 'Rust', 'AI', 'Machine Learning', 'Data Science', 'Cybersecurity',
        'Cloud', 'DevOps', 'Gaming', 'Game Dev', 'Fotografie', 'Muziek', 'Sport', 'Tech', 'UI/UX'
    ];
    suggestions.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        interestSuggestions.appendChild(o);
    });
    const communityOptions = ['Cloud-', 'HTML&CSS', 'Game Development', 'Cybersecurity', 'AI', 'Gamedev'];
    communityOptions.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        communitySuggestions.appendChild(o);
    });

    function renderChips() {
        if (!chipsContainer || !interestsCountEl) return;
        chipsContainer.innerHTML = '';
        interests.forEach((name) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.innerHTML = `<span>${name}</span><i data-lucide="x"></i>`;
            chip.addEventListener('click', () => removeInterest(name));
            chipsContainer.appendChild(chip);
        });
        interestsCountEl.textContent = interests.length.toString();
        try { lucide.createIcons(); } catch (e) {}
        renderSidebarInterests();
    }

    function removeInterest(name) {
        interests = interests.filter(i => i !== name);
        renderChips();
        try { localStorage.setItem(STORAGE_KEYS.interests, JSON.stringify(interests)); } catch (e) {}
    }

    interestInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addInterest(interestInput.value);
            interestInput.value = '';
        } else if (e.key === 'Backspace' && !interestInput.value && interests.length) {
            removeInterest(interests[interests.length - 1]);
        }
    });

    interestInput.addEventListener('change', function() {
        // Bij selectie uit datalist
        if (this.value) {
            addInterest(this.value);
            this.value = '';
        }
    });

    // Community-chips
    function renderCommunityChips() {
        communityChips.innerHTML = '';
        communities.forEach((name) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.innerHTML = `<span>${name}</span><i data-lucide=\"x\"></i>`;
            chip.addEventListener('click', () => removeCommunity(name));
            communityChips.appendChild(chip);
        });
        communitiesCountEl.textContent = communities.length.toString();
        lucide.createIcons();
        renderSidebarCommunities();
    }

    function addCommunity(name) {
        const clean = name.trim();
        if (!clean) return;
        if (communities.includes(clean)) return;
        communities.push(clean);
        renderCommunityChips();
        try { localStorage.setItem(STORAGE_KEYS.communities, JSON.stringify(communities)); } catch (e) {}
    }

    function removeCommunity(name) {
        communities = communities.filter(i => i !== name);
        renderCommunityChips();
        try { localStorage.setItem(STORAGE_KEYS.communities, JSON.stringify(communities)); } catch (e) {}
    }

    communityInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addCommunity(communityInput.value);
            communityInput.value = '';
        } else if (e.key === 'Backspace' && !communityInput.value && communities.length) {
            removeCommunity(communities[communities.length - 1]);
        }
    });

    communityInput.addEventListener('change', function() {
        if (this.value) {
            addCommunity(this.value);
            this.value = '';
        }
    });

    // Sidebar sneltoevoeg-knoppen
    const sidebarAddCommunity = document.getElementById('sidebarAddCommunity');
    const sidebarAddInterest = document.getElementById('sidebarAddInterest');
    sidebarAddCommunity.addEventListener('click', function() {
        openProfileModal();
        setTimeout(() => { communityInput.focus(); }, 0);
    });
    sidebarAddInterest.addEventListener('click', function() {
        openProfileModal();
        setTimeout(() => { interestInput.focus(); }, 0);
    });

    // Selecties spiegelen op dashboard (linker sidebar)
    const dotClasses = ['bg-green','bg-blue','bg-orange','bg-purple'];
    function renderSidebarCommunities() {
        if (!sidebarCommunityList) return;
        sidebarCommunityList.innerHTML = '';
        communities.forEach((name, idx) => {
            const li = document.createElement('li');
            li.className = 'community-item';
            const dot = document.createElement('div');
            dot.className = `community-dot ${dotClasses[idx % dotClasses.length]}`;
            const nameEl = document.createElement('span');
            nameEl.textContent = name;
            li.appendChild(dot);
            li.appendChild(nameEl);
            sidebarCommunityList.appendChild(li);
        });
    }

    function renderSidebarInterests() {
        if (!sidebarInterestsGrid) return;
        sidebarInterestsGrid.innerHTML = '';
        if (!interests || interests.length === 0) {
            // toon lege placeholder
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-interests';
            emptyDiv.style.cssText = 'text-align: center; padding: 20px 0; color: #9ca3af; font-style: italic;';
            emptyDiv.innerHTML = '<div style="font-size: 32px; margin-bottom: 10px;">🤔</div>\
                                <p style="margin: 0; font-size: 14px;">Nog geen interesses toegevoegd</p>\
                                <p style="margin: 5px 0 0 0; font-size: 12px;">Klik hieronder om nu te beginnen!</p>';
            sidebarInterestsGrid.appendChild(emptyDiv);
            return;
        }
        interests.forEach((name) => {
            const span = document.createElement('span');
            span.className = 'interest-tag';
            span.textContent = name;
            sidebarInterestsGrid.appendChild(span);
        });
    }
    // Opgeslagen staat of standaardwaarden laden
    (function initProfileState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.interests);
            console.log('[interests:init] raw from storage:', raw);
            const savedInterests = JSON.parse(raw || '[]');
            if (Array.isArray(savedInterests)) {
                interests = savedInterests;
            } else {
                interests = [];
            }
        } catch (e) {
            console.warn('[interests:init] parse error:', e);
            interests = [];
        }
        try {
            const savedCommunities = JSON.parse(localStorage.getItem(STORAGE_KEYS.communities) || '[]');
            if (Array.isArray(savedCommunities) && savedCommunities.length) {
                communities = savedCommunities;
            } else {
                communities = ['HTML&CSS', 'Cloud-'];
            }
        } catch (e) {
            communities = ['HTML&CSS', 'Cloud-'];
        }
        try {
            currentBio = localStorage.getItem(STORAGE_KEYS.bio) || '';
        } catch (e) { currentBio = ''; }
        interestsCountEl.textContent = interests.length.toString();
        communitiesCountEl.textContent = communities.length.toString();
        renderSidebarInterests();
        renderSidebarCommunities();
    })();
});

// Fallback handlers voor het welkomstvenster (zeker sluiten/openen)
document.addEventListener('DOMContentLoaded', function() {
    const welcomePopup = document.getElementById('welcome-popup');
    const closeWelcome = document.getElementById('close-welcome');
    const startAdding = document.getElementById('start-adding');
    const interestOverlay = document.getElementById('interest-overlay');

    function closeWelcomePopup() {
        if (!welcomePopup) return;
        welcomePopup.style.display = 'none';
        welcomePopup.classList.add('hidden');
    }

    function openMainModal() {
        if (!interestOverlay) return;
        interestOverlay.style.display = 'flex';
        interestOverlay.classList.remove('hidden');
    }

    if (closeWelcome) {
        closeWelcome.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); closeWelcomePopup(); });
    }
    if (startAdding) {
        startAdding.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); closeWelcomePopup(); setTimeout(openMainModal, 150); });
    }
    if (welcomePopup) {
        welcomePopup.addEventListener('click', function(e){ if (e.target === welcomePopup) closeWelcomePopup(); });
    }
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && welcomePopup && !welcomePopup.classList.contains('hidden')) closeWelcomePopup(); });
});

// Extra interest modal functionality from JavascriptB.js (merged)
document.addEventListener('DOMContentLoaded', function() {
    const addInterestBtn = document.getElementById('add-interest-btn');
    const overlay = document.getElementById('interest-overlay');
    const closeOverlay = document.getElementById('close-overlay');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveInterestBtn = document.getElementById('save-interest-btn');
    const searchInput = document.getElementById('interest-search');
    const interestsGrid = document.querySelector('.interests-grid');
    const selectedList = document.getElementById('selected-list');
    const selectionCount = document.getElementById('selection-count');

    // Zorg dat sluit- en toets-events altijd werken als overlay bestaat
    if (!overlay) return;

    let selectedInterests = new Set();

    if (addInterestBtn) {
        addInterestBtn.addEventListener('click', function(e) {
            e.preventDefault();
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
            if (searchInput) searchInput.focus();
            updateSelectableInterests();
            // Toon meteen correcte teller op de knop
            updateSelectedList();
        });
    }

    if (closeOverlay) closeOverlay.addEventListener('click', function(){ closeModal(); });
    if (cancelBtn) cancelBtn.addEventListener('click', function(){ closeModal(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal(); });

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const categories = document.querySelectorAll('.category-section');
            categories.forEach(category => {
                const interests = category.querySelectorAll('.selectable-interest');
                let hasVisibleInterests = false;
                interests.forEach(interest => {
                    const interestText = interest.textContent.toLowerCase();
                    if (interestText.includes(searchTerm)) { interest.style.display = 'inline-block'; hasVisibleInterests = true; }
                    else { interest.style.display = 'none'; }
                });
                category.style.display = hasVisibleInterests || searchTerm === '' ? 'block' : 'none';
            });
        });
    }

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('selectable-interest')) {
            const interest = e.target.dataset.interest;
            if (e.target.classList.contains('selected')) {
                e.target.classList.remove('selected');
                selectedInterests.delete(interest);
            } else {
                e.target.classList.add('selected');
                selectedInterests.add(interest);
            }
            updateSelectedList();
        }
        if (e.target.classList.contains('remove-selected')) {
            const interest = e.target.dataset.interest;
            selectedInterests.delete(interest);
            const selectableInterest = document.querySelector(`[data-interest="${interest}"]`);
            if (selectableInterest) selectableInterest.classList.remove('selected');
            updateSelectedList();
        }
    });

    if (saveInterestBtn) {
        saveInterestBtn.addEventListener('click', function() {
            if (selectedInterests.size === 0) { alert('Selecteer eerst één of meer interesses!'); return; }
            saveSelectedInterests();
        });
    }

    function updateSelectedList() {
        if (selectedList) selectedList.innerHTML = '';
        // Update het label van de toevoegen-knop om aantal te tonen
        if (saveInterestBtn) {
            const count = selectedInterests.size;
            saveInterestBtn.textContent = `Toevoegen (${count})`;
        }
        if (selectionCount) selectionCount.textContent = selectedInterests.size;
        if (selectedInterests.size === 0) { if (selectedList) selectedList.innerHTML = '<p class="no-selection">Geen interesses geselecteerd</p>'; return; }
        selectedInterests.forEach(interest => {
            if (selectedList) {
                const tag = document.createElement('span');
                tag.className = 'selected-tag';
                tag.innerHTML = `${interest}<button class="remove-selected" data-interest="${interest}">&times;</button>`;
                selectedList.appendChild(tag);
            }
        });
    }

    function updateSelectableInterests() {
        const existingInterests = Array.from(interestsGrid.querySelectorAll('.interest-tag')).map(tag => tag.textContent.replace('×', '').trim());
        const selectableInterests = document.querySelectorAll('.selectable-interest');
        selectableInterests.forEach(interest => {
            const interestName = interest.dataset.interest;
            if (existingInterests.includes(interestName)) { interest.classList.add('already-added'); interest.style.pointerEvents = 'none'; }
            else { interest.classList.remove('already-added'); interest.style.pointerEvents = 'auto'; }
        });
    }

    function closeModal() {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        selectedInterests.clear();
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.selectable-interest.selected').forEach(interest => interest.classList.remove('selected'));
        document.querySelectorAll('.category-section').forEach(category => {
            category.style.display = 'block';
            category.querySelectorAll('.selectable-interest').forEach(interest => { interest.style.display = 'inline-block'; });
        });
        updateSelectedList();
    }

    function saveSelectedInterests() {
        // 1) Genereer nieuwe lijst uit uitsluitend de huidige selectie
        const newList = Array.from(selectedInterests);
        const sidebarGrid = document.querySelector('.left-sidebar .interests-grid');

        // 2) Sla exact deze lijst op in localStorage en sync de in-memory staat
        try {
            localStorage.setItem('interestlink.interests', JSON.stringify(newList));
            console.log('[interests:save] saved:', newList);
        } catch (e) {
            console.error('[interests:save] error saving to localStorage:', e);
        }
        interests = newList.slice();

        // 3) Sidebar opnieuw tekenen op basis van de nieuwe lijst
        if (sidebarGrid) {
            sidebarGrid.innerHTML = '';
            if (newList.length > 0) {
                newList.forEach(name => {
                    const span = document.createElement('span');
                    span.className = 'interest-tag';
                    span.textContent = name;
                    sidebarGrid.appendChild(span);
                });
            } else {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-interests';
                emptyDiv.style.cssText = 'text-align: center; padding: 20px 0; color: #9ca3af; font-style: italic;';
                emptyDiv.innerHTML = '<div style="font-size: 32px; margin-bottom: 10px;">🤔</div>\
                                <p style="margin: 0; font-size: 14px;">Nog geen interesses toegevoegd</p>\
                                <p style="margin: 5px 0 0 0; font-size: 12px;">Klik hieronder om nu te beginnen!</p>';
                sidebarGrid.appendChild(emptyDiv);
            }
        }

        // 4) Teller bijwerken
        const interestsCountEl = document.getElementById('interestsCount');
        if (interestsCountEl) interestsCountEl.textContent = String(newList.length);

        // 4) Modal sluiten en feedback
        closeModal();
        // 4b) selectie resetten
        selectedInterests.clear();
        updateSelectedList();
        if (newList.length > 0) {
            const message = newList.length === 1 ? '1 interesse toegevoegd!' : `${newList.length} interesses toegevoegd!`;
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            document.body.appendChild(successDiv);
            setTimeout(() => { successDiv.classList.add('show'); }, 10);
            setTimeout(() => { successDiv.classList.remove('show'); setTimeout(() => { successDiv.remove(); }, 300); }, 3000);
        }
    }
});

// Posts: creation, render, and persistence
document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY_POSTS = 'interestlink.posts';
    const postsFeed = document.getElementById('postsFeed');
    const postText = document.getElementById('postText');
    const postCommunity = document.getElementById('postCommunity');
    const postBtn = document.getElementById('postBtn');
    const photoBtn = document.getElementById('photoBtn');
    const photoInput = document.getElementById('photoInput');
    const postsSearch = document.getElementById('postsSearch');
    let pendingImageDataUrl = '';
    let currentSearchTerm = '';

    if (!postsFeed || !postText || !postBtn || !postCommunity) return;

    function loadPosts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_POSTS) || '[]';
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) return arr;
            return [];
        } catch { return []; }
    }

    function savePosts(posts) {
        try { localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts)); } catch (e) {}
    }

    function getUserProfile() {
        try { return JSON.parse(localStorage.getItem('interestLinkProfile') || 'null'); } catch { return null; }
    }

    function formatTime(ts) {
        const diffMs = Date.now() - ts;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 60) return diffMin + 'm';
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return diffH + 'u';
        const diffD = Math.floor(diffH / 24);
        return diffD + 'd';
    }

    function renderPosts() {
        const all = loadPosts();
        const term = (currentSearchTerm || '').toLowerCase().trim();
        const posts = term
            ? all.filter(p => {
                const hay = [p.text || '', p.authorName || '', p.community || ''].join(' ').toLowerCase();
                return hay.includes(term);
            })
            : all;
        postsFeed.innerHTML = '';
        posts
            .sort((a, b) => b.createdAt - a.createdAt)
            .forEach(p => {
                // Normaliseer data
                if (typeof p.likes !== 'number') p.likes = 0;
                if (!Array.isArray(p.comments)) {
                    if (typeof p.comments === 'number') p.comments = [];
                    else p.comments = [];
                }
                const commentsCount = Array.isArray(p.comments) ? p.comments.length : (p.comments || 0);

                const article = document.createElement('article');
                article.className = 'post';
                article.dataset.postId = p.id;
                article.innerHTML = `
                    <div class="post-header">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&face=center" alt="${p.authorName}" class="avatar">
                        <div class="post-author-info">
                            <span class="author-name">${p.authorName || 'Gebruiker'}</span>
                            <div class="post-meta">
                                ${p.community ? `<span class="community-badge bg-blue">${p.community}</span>` : ''}
                                <span class="timestamp">${formatTime(p.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="post-content">
                        <p></p>
                        ${p.image ? `<img src="${p.image}" alt="post image" class="post-image">` : ''}
                    </div>
                    <div class="post-actions">
                        <button class="action-btn ${p.likedByMe ? 'liked' : ''}" data-action="like"><i data-lucide="heart"></i><span class="like-count">${p.likes || 0}</span></button>
                        <button class="action-btn" data-action="comment"><i data-lucide="message-circle"></i><span class="comment-count">${commentsCount}</span></button>
                    </div>
                    <div class="comments-section collapsed">
                        <div class="comments-list">
                            ${p.comments.map(c => `
                                <div class=\"comment-item\">
                                    <div class=\"comment-item-head\">
                                        <span class=\"comment-author\">${c.authorName || 'Gebruiker'}</span>
                                        <span class=\"comment-time\">${formatTime(c.createdAt || Date.now())}</span>
                                    </div>
                                    <div class=\"comment-text\">${c.text || ''}</div>
                                </div>
                            `).join('')}
                        </div>
                        <form class="comment-form" data-post-id="${p.id}">
                            <input class="comment-input" type="text" placeholder="Schrijf een reactie..." />
                            <button class="comment-submit" type="submit">Plaatsen</button>
                        </form>
                    </div>
                `;
                article.querySelector('p').textContent = p.text;
                postsFeed.appendChild(article);
            });
        try { lucide.createIcons(); } catch (e) {}
    }

    function createPost() {
        const text = (postText.value || '').trim();
        const community = (postCommunity.value || '').trim();
        if (!text) {
            alert('Schrijf eerst een bericht.');
            return;
        }
        const profile = getUserProfile();
        const posts = loadPosts();
        posts.push({
            id: 'p_' + Date.now(),
            text,
            community,
            authorName: profile?.name || 'Gebruiker',
            createdAt: Date.now(),
            likes: 0,
            likedByMe: false,
            comments: [],
            image: pendingImageDataUrl || ''
        });
        savePosts(posts);
        postText.value = '';
        postCommunity.value = '';
        pendingImageDataUrl = '';
        renderPosts();
    }

    // initial render
    renderPosts();
    if (postsSearch) {
        postsSearch.addEventListener('input', function() {
            currentSearchTerm = this.value || '';
            renderPosts();
        });
    }

    // Event delegation voor likes en comments
    postsFeed.addEventListener('click', function(e) {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const article = e.target.closest('article.post');
        if (!article) return;
        const postId = article.dataset.postId;
        const action = btn.getAttribute('data-action');
        if (!postId || !action) return;

        const posts = loadPosts();
        const idx = posts.findIndex(p => String(p.id) === String(postId));
        if (idx === -1) return;
        const post = posts[idx];

        if (action === 'like') {
            post.likedByMe = !post.likedByMe;
            if (typeof post.likes !== 'number') post.likes = 0;
            post.likes += post.likedByMe ? 1 : -1;
            if (post.likes < 0) post.likes = 0;
            savePosts(posts);
            // UI bijwerken zonder volledige re-render
            btn.classList.toggle('liked', !!post.likedByMe);
            const likeSpan = btn.querySelector('.like-count');
            if (likeSpan) likeSpan.textContent = String(post.likes);
        } else if (action === 'comment') {
            const section = article.querySelector('.comments-section');
            if (section) section.classList.remove('collapsed');
            const input = article.querySelector('.comment-input');
            if (input) input.focus();
        }
    });

    postsFeed.addEventListener('submit', function(e) {
        const form = e.target.closest('.comment-form');
        if (!form) return;
        e.preventDefault();
        const postId = form.getAttribute('data-post-id');
        const input = form.querySelector('.comment-input');
        const text = (input?.value || '').trim();
        if (!text) return;
        const posts = loadPosts();
        const idx = posts.findIndex(p => String(p.id) === String(postId));
        if (idx === -1) return;
        const profile = getUserProfile();
        if (!Array.isArray(posts[idx].comments)) posts[idx].comments = [];
        posts[idx].comments.push({ id: 'c_' + Date.now(), authorName: profile?.name || 'Gebruiker', text, createdAt: Date.now() });
        savePosts(posts);
        input.value = '';
        // Re-render alleen dit artikel door volledige render (eenvoudig)
        renderPosts();
        // Focus terugzetten
        const newInput = postsFeed.querySelector(`article.post[data-post-id="${postId}"] .comment-input`);
        if (newInput) newInput.focus();
    });

    postBtn.addEventListener('click', function(e) { e.preventDefault(); createPost(); });
    if (photoBtn && photoInput) {
        photoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            photoInput.click();
        });
        photoInput.addEventListener('change', function() {
            const file = this.files && this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                pendingImageDataUrl = ev.target && ev.target.result ? ev.target.result : '';
            };
            reader.readAsDataURL(file);
        });
    }
});