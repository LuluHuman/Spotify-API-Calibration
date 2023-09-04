
var prog = 0
var proglimi = 0
const urlObj = new URL(document.location.href);
const params = new URLSearchParams(urlObj.hash.replace('#', ''));

const playlist = params.get('playlist');
const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');

if (accessToken === null || refreshToken === null) {
    document.location.href = '/login';
}


class spotify {
    constructor(playlist) {
        this.playlist = playlist
        this.accessToken = undefined
        this.audio = undefined
        this.user = undefined
        this.liked = undefined
        this.pl = undefined
    }

    async api(url, head) {
        const header = head ? head : {}
        header.headers = {
            'Authorization': `Bearer ${this.accessToken}`
        }

        const res = await fetch(url, header)

        if (res.status == 401) {
            const refreash = await fetch("/refresh_token?refresh_token=" + refreshToken)
            const token = await refreash.json();

            const ot = this.accessToken
            this.accessToken = token.access_token

            console.log("token refreashed:", ot !== this.accessToken);
            return await this.api(url)
        }
        return res
    }

    async login(accessToken) {
        this.accessToken = accessToken
        
        const responseUser = await this.api('https://api.spotify.com/v1/me')
        const dataUser = await responseUser.json();
        this.user = dataUser

        await this.getLiked()
        await this.getPlaylist()

        return dataUser
    }

    async getLiked(offset) {
        var liked = await this.api('https://api.spotify.com/v1/me/tracks?limit=50' + (offset ? "&offset=" + offset : ""))
        liked = await liked.json();
        this.liked = liked

        proglimi = 0
        return liked
    }

    async getPlaylist() {
        var pl = []
        var playli = await this.api(`https://api.spotify.com/v1/playlists/${this.playlist}/tracks?limit=50`)
        playli = await playli.json();
        playli.items.forEach((item) => {
            if (item.track.id) pl.push(item.track.id)
        })
        //
        if (Math.floor(playli.total / 50) - 1 != 0) {
            for (let i = 0; i < Math.floor(playli.total / 50); i++) {
                playli = await this.api(`https://api.spotify.com/v1/playlists/${this.playlist}/tracks?limit=${50}&offset=${50 * (i + 1)}`)
                playli = await playli.json();
                playli.items.forEach((item) => {
                    if (item.track.id) pl.push(item.track.id)
                })
            }
        }
        this.pl = pl
        return pl
    }

    changesongaval(stf, type) {
        this.audio.remove()

        const toadd = stf.liked.items[proglimi].track

        if ((stf.pl.indexOf(toadd.id) == -1 && type == "POST") || (stf.pl.indexOf(toadd.id) !== -1 && type == "DELETE")) {
            this.api('https://api.spotify.com/v1/playlists/' + stf.playlist + '/tracks', {
                method: type,
                body: JSON.stringify({
                    "uris": [toadd.uri],
                    "position": 0
                })
            });
        }
        prog = prog + 1
        proglimi = proglimi + 1
        this.nextsong()
    }

    async nextsong() {
        if (this.liked.items[proglimi] == undefined) this.getLiked(prog)
        const item = this.liked.items[proglimi].track
        document.getElementById("alb-art").src = item.album.images[0].url
        document.getElementById("title").innerHTML = item.name
        document.getElementById("subtitle").innerHTML = item.artists[0].name
        const prev = item.preview_url

        const toadd = this.liked.items[proglimi].track

        if (this.pl.indexOf(toadd.id) !== -1) {
            document.getElementById("add").innerHTML = "arrow_circle_right"
            document.getElementById("remove").innerHTML = "delete_forever"
        } else {
            document.getElementById("add").innerHTML = "add_circle"
            document.getElementById("remove").innerHTML = "do_not_disturb_on"
        }

        this.audio = document.createElement('source');
        this.audio.setAttribute('src', prev);
        this.audio.setAttribute('type', 'audio/mpeg');
        document.getElementById("audio").appendChild(this.audio);

        document.getElementById("audio").load();
        document.getElementById("audio").play();
    }
}
(async () => {
    const stf = new spotify(playlist)
    const dataUser = await stf.login(accessToken)

    console.log(dataUser, "|dataUser");
    document.title = "Logged in as " + dataUser.display_name;


    console.log(stf.liked);

    stf.nextsong()
    window.addEventListener("keydown", (eve) => {
        switch (eve.key) {
            case "ArrowLeft":
                stf.changesongaval(stf, 'POST')
                break;

            case "ArrowRight":
                stf.changesongaval(stf, 'DELETE')
                break;
        }
    });
    document.getElementById("add").onclick = () => { stf.changesongaval(stf, 'POST') }
    document.getElementById("remove").onclick = () => { stf.changesongaval(stf, 'DELETE') }


})()