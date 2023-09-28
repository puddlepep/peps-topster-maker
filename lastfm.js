async function searchLastFM(album) {
    let apiKey ="00343b857063e3112bb016e7a5c14f37";
    let url = `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${album}&api_key=${apiKey}&format=json`
    let response = await fetch(url);
    let data = await response.json();

    let albums = data["results"]["albummatches"]["album"]
    return albums;
}
