import { Discojs } from 'discojs';

const client = new Discojs({
  userToken: process.env.USER_TOKEN
});

// List of instruments or role returned by the Discogs API
const instruments = ["Acoustic Bass", "Acoustic Guitar", "Alto Saxophone", "Arranged By", "Backing Band", "Backing Vocals", "Baritone Saxophone", "Bass", "Bass Guitar", "Bongos", "Brass", "Cello", "Clarinet", "Congas", "Conductor", "Drums", "Electric Bass", "Electric Guitar", "Engineer", "Fender Rhodes", "Flute", "French Horn", "Guitar", "Harmonica", "Harp", "Keyboards", "Lead Guitar", "Lead Vocals", "Mixed By", "Organ", "Percussion", "Piano", "Producer", "Rhythm Guitar", "Saxophone", "Synthesizer", "Tenor Saxophone", "Trombone", "Trumpet", "Vibraphone", "Viola", "Violin", "Vocals"]

const form = document.querySelector('form');
form.addEventListener('submit', handleSubmit);

async function searchAlbum(artist, album) {
  const releases = await client.searchRelease(album, { type: 'master', artist: artist, })
  const albumList = document.querySelector('#app');

  
  if (releases.results.length === 0) {
    albumList.innerHTML += '<p>No albums found.</p>';
    return;
  }
  
  // Find the first release, as not to get 50 versions of the same album
  const oldestRelease = releases.results.reduce((oldest, current) => {
    return (current.year < oldest.year) ? current : oldest;
  });
  // Only master releases searched for with ID return credits from the album in response. Damn you Discogs API!
  const master = await client.getRelease(oldestRelease.id);
  
  // Generating some HTML to show results
  albumList.innerHTML = `<h2>Albums by ${artist} - ${album}</h2>`;
  const ul = document.createElement('ul');
  const li = document.createElement('li');
  li.innerHTML = `<pre>${JSON.stringify(master, null, 2)}</pre><hr><hr>`;
  ul.appendChild(li);
  albumList.appendChild(ul);

  // Looking for collaborators
  const connections = await lookForCollaborators(artist, master);
  
  // Generating some HTML to show results
  if (connections.length > 0) {
    const connectionsList = document.createElement('ul');
    connectionsList.innerHTML = `<h2>Connections to ${artist}:</h2>`;
    connections.forEach(connection => {
      const connectionLi = document.createElement('li');
      connectionLi.textContent = `${connection.name} (${connection.count} connections)`;
      connectionsList.appendChild(connectionLi);
    });
    albumList.appendChild(connectionsList);
  }
}

async function lookForCollaborators(artist, master) {
  const connections = [];

  // Search for the artist and get their releases
  const artistSearchResults = await client.searchArtist(artist);
  const artistReleases = await client.getArtistReleases(artistSearchResults.results[0].id);

  // Find all the releases that have the same album title as the master release
  const matchingReleases = artistReleases.releases.filter(release => {
    return release.title.toLowerCase() === master.title.toLowerCase
  })
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const artist = formData.get('artist');
  const album = formData.get('album');
  searchAlbum(artist, album);
}