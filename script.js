async function fetchWikipediaPageContent(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|images&format=json&origin=*`;
    document.getElementById('results').innerHTML = '<div class="loading">Loading...</div>';

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            document.getElementById('results').innerHTML = `
                <div class="error-message">
                    <p>Error: ${data.error.info}</p>
                </div>
            `;
            return;
        }

        const page = data.parse;
        const htmlContent = cleanWikipediaHTML(page.text['*']);
        const images = page.images.map(img => img['*']);

        const imagePreviews = await Promise.all(
            images.slice(0, 5).map(image => getImageUrl(image))
        );

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <article class="article-content">
                <h1 class="article-title">${page.title}</h1>
                <div class="wiki-text">${htmlContent}</div>
            </article>
            
            ${imagePreviews.length > 0 ? `
                <h2 class="section-title">Images</h2>
                <div class="image-gallery">
                    ${imagePreviews.filter(img => img).map(img => `
                        <div class="image-card">
                            <img src="${img.url}" alt="${img.title}" onerror="this.style.display='none'">
                            <div class="image-caption">${img.title.replace('File:', '')}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

    } catch (error) {
        document.getElementById('results').innerHTML = `
            <div class="error-message">
                <p>Failed to load page. Please try another search.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function cleanWikipediaHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const elementsToRemove = [
        '.hatnote', 
        '.metadata', 
        '.reference', 
        '.noprint',
        '.navbox',
        '.infobox',
        '.sidebar',
        '.mw-editsection'
    ];
    
    elementsToRemove.forEach(selector => {
        tempDiv.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    tempDiv.querySelectorAll('.citation').forEach(cite => {
        cite.innerHTML = `<sup>[<a href="${cite.querySelector('a')?.href || '#'}" target="_blank">source</a>]</sup>`;
    });

    tempDiv.querySelectorAll('a').forEach(link => {
        if (link.href.includes('/wiki/')) {
            let wikiPath = new URL(link.href).pathname.split('/').pop();
            console.warn(`Page: ${wikiPath}`);
            link.href = `?q=${decodeURIComponent(wikiPath.replace(/_/g, ' '))}`;
        }
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
    
    tempDiv.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
            img.src = src.startsWith('//') ? `https:${src}` : src;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        }
    });
    
    return tempDiv.innerHTML;
}

async function getImageUrl(imageName) {
    try {
        if (imageName.startsWith('File:')) {
            const filename = imageName.replace('File:', '').replace(/ /g, '_');
            const encodedFilename = encodeURIComponent(filename);
            const md5 = CryptoJS.MD5(encodedFilename).toString();
            const path = `${md5.charAt(0)}/${md5.charAt(0)}${md5.charAt(1)}`;
            
            return {
                title: imageName,
                url: `https://upload.wikimedia.org/wikipedia/commons/${path}/${encodedFilename}`
            };
        }

        const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=url&format=json&origin=*`
        );
        const data = await response.json();
        const page = Object.values(data.query.pages)[0];
        
        if (page?.imageinfo?.[0]) {
            return {
                title: imageName,
                url: page.imageinfo[0].url.replace(/\/\d+px-/, '/800px-')
            };
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchWikipedia();
    }
}

async function searchWikipedia() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        await fetchWikipediaPageContent(query);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const Query = urlParams.get('q');
    const Image = urlParams.get('simage');
    const rickroll = urlParams.get('topserect');
    
    if (Query) {
        document.getElementById('searchInput').value = Query;
        fetchWikipediaPageContent(Query);
    }

    if (rickroll !== null) {
        var button = document.createElement("button");
        button.innerText = "Show";
        button.style.position = "fixed";
        button.style.top = "50%";
        button.style.left = "50%";
        button.style.transform = "translate(-50%, -50%)";
        button.style.padding = "10px 20px";
        button.style.fontSize = "16px";
        button.style.cursor = "pointer";
        document.body.appendChild(button);
    
        var video = document.createElement("video");
        video.src = "shh.mp4";
        video.style.display = "none"; 
        video.style.position = "fixed";
        video.style.top = "0";
        video.style.left = "0";
        video.style.right = "0";
        video.style.bottom = "0";
        video.style.width = "100%";
        video.style.height = "auto";
        video.loop = true;
        video.controls = false;
        document.body.appendChild(video);
    
        button.addEventListener("click", function () {
            video.style.display = "block";
            video.play();
            button.remove();
        });
    }       
})
