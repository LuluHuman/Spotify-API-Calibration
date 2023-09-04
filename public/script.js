const urlObj = new URL(document.location.href);
const params = new URLSearchParams(urlObj.hash.replace('#', ''));

const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');

if (accessToken === null || refreshToken === null) {
    document.location.href = '/login';
}

(async () => {
    const responseUser = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const dataUser = await responseUser.json();

    document.title = "Logged in as " + dataUser.display_name;

    const responsePl = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const dataPl = await responsePl.json();
    dataPl.items.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<a href="/playlist${urlObj.hash}&playlist=${item.id}"><img src="${item.images[0] ? item.images[0].url : ""}">\n<span>${item.name}</span></a>`
        document.getElementById('tblpl').appendChild(tr);
    })
})()
