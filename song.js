class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentTrack = 0;
        this.isPlaying = false;
        this.isShuffling = false;
        this.isRepeating = false;
        this.currentTheme = 'light';

        this.initializeElements();
        this.bindEvents();
        this.loadSavedData();
    }

    initializeElements() {
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');

        this.progressBar = document.querySelector('.progress-bar');
        this.progressFill = document.querySelector('.progress-fill');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');

        this.trackTitle = document.querySelector('.track-title');
        this.trackArtist = document.querySelector('.track-artist');

        this.fileInput = document.getElementById('fileInput');
        this.playlistContainer = document.getElementById('playlist');
        this.searchInput = document.getElementById('searchInput');

        this.themeToggle = document.getElementById('themeToggle');

        this.modal = document.getElementById('playlistModal');
        this.createPlaylistBtn = document.getElementById('createPlaylistBtn');
        this.savePlaylistBtn = document.getElementById('savePlaylistBtn');
        this.loadPlaylistBtn = document.getElementById('loadPlaylistBtn');

        this.filterButtons = document.querySelectorAll('.filter-btn');
    }

    bindEvents() {

        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));


        this.audio.addEventListener('loadedmetadata', () => this.updateTrackInfo());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());


        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());


        this.progressBar.addEventListener('click', (e) => this.seekTrack(e));


        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        this.searchInput.addEventListener('input', (e) => this.searchTracks(e.target.value));

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.filterTracks(e.target.dataset.filter));
        });


        this.themeToggle.addEventListener('click', () => this.toggleTheme());


        this.createPlaylistBtn.addEventListener('click', () => this.showCreatePlaylistModal());
        this.savePlaylistBtn.addEventListener('click', () => this.savePlaylist());
        this.loadPlaylistBtn.addEventListener('click', () => this.loadPlaylist());


        document.querySelector('.close').addEventListener('click', () => this.hideModal());
        document.getElementById('confirmCreatePlaylist').addEventListener('click', () => this.createPlaylist());


        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);

        files.forEach(file => {
            if (file.type.startsWith('audio/')) {
                const track = {
                    id: Date.now() + Math.random(),
                    file: file,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: 'Unknown Artist',
                    genre: this.guessGenre(file.name),
                    duration: 0,
                    url: URL.createObjectURL(file)
                };

                this.playlist.push(track);
                this.addTrackToPlaylist(track);
            }
        });

        this.savePlaylistToStorage();
    }

    guessGenre(filename) {
        const genres = ['rock', 'pop', 'jazz', 'classical', 'hip-hop', 'electronic'];
        const lowerFilename = filename.toLowerCase();

        for (let genre of genres) {
            if (lowerFilename.includes(genre)) {
                return genre;
            }
        }
        return 'unknown';
    }

    addTrackToPlaylist(track) {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.dataset.trackId = track.id;

        playlistItem.innerHTML = `
            <div class="playlist-item-info">
                <div class="playlist-item-title">${track.title}</div>
                <div class="playlist-item-artist">${track.artist} • ${track.genre}</div>
            </div>
            <div class="playlist-item-duration">--:--</div>
            <div class="playlist-item-actions">
                <button onclick="musicPlayer.removeTrack(${track.id})" title="Remove">🗑️</button>
            </div>
        `;

        playlistItem.addEventListener('click', () => this.selectTrack(track.id));
        this.playlistContainer.appendChild(playlistItem);


        this.loadTrackMetadata(track, playlistItem);
    }

    loadTrackMetadata(track, playlistItem) {
        const tempAudio = new Audio(track.url);
        tempAudio.addEventListener('loadedmetadata', () => {
            track.duration = tempAudio.duration;
            const durationEl = playlistItem.querySelector('.playlist-item-duration');
            durationEl.textContent = this.formatTime(track.duration);
        });
    }

    selectTrack(trackId) {
        const trackIndex = this.playlist.findIndex(track => track.id === trackId);
        if (trackIndex !== -1) {
            this.currentTrack = trackIndex;
            this.loadCurrentTrack();
        }
    }

    loadCurrentTrack() {
        if (this.playlist.length === 0) return;

        const track = this.playlist[this.currentTrack];
        this.audio.src = track.url;
        this.trackTitle.textContent = track.title;
        this.trackArtist.textContent = `${track.artist} • ${track.genre}`;


        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.querySelector(`[data-track-id="${track.id}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    togglePlayPause() {
        if (this.playlist.length === 0) return;

        if (this.isPlaying) {
            this.audio.pause();
            this.playPauseBtn.textContent = '▶️';
            this.isPlaying = false;
        } else {
            this.audio.play();
            this.playPauseBtn.textContent = '⏸️';
            this.isPlaying = true;
        }
    }

    previousTrack() {
        if (this.playlist.length === 0) return;

        this.currentTrack = this.currentTrack > 0 ? this.currentTrack - 1 : this.playlist.length - 1;
        this.loadCurrentTrack();

        if (this.isPlaying) {
            this.audio.play();
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;

        if (this.isShuffling) {
            this.currentTrack = Math.floor(Math.random() * this.playlist.length);
        } else {
            this.currentTrack = this.currentTrack < this.playlist.length - 1 ? this.currentTrack + 1 : 0;
        }

        this.loadCurrentTrack();

        if (this.isPlaying) {
            this.audio.play();
        }
    }

    toggleShuffle() {
        this.isShuffling = !this.isShuffling;
        this.shuffleBtn.style.color = this.isShuffling ? 'var(--primary-color)' : '';
        this.shuffleBtn.style.background = this.isShuffling ? 'rgba(108, 92, 231, 0.1)' : '';
    }

    toggleRepeat() {
        this.isRepeating = !this.isRepeating;
        this.repeatBtn.style.color = this.isRepeating ? 'var(--primary-color)' : '';
        this.repeatBtn.style.background = this.isRepeating ? 'rgba(108, 92, 231, 0.1)' : '';
    }

    handleTrackEnd() {
        if (this.isRepeating) {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.nextTrack();
        }
    }

    seekTrack(event) {
        const progressBar = event.currentTarget;
        const clickX = event.offsetX;
        const width = progressBar.offsetWidth;
        const duration = this.audio.duration;

        if (duration) {
            const newTime = (clickX / width) * duration;
            this.audio.currentTime = newTime;
        }
    }

    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = `${progress}%`;

            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    updateTrackInfo() {
        if (this.audio.duration) {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    setVolume(volume) {
        this.audio.volume = volume / 100;
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    searchTracks(query) {
        const items = document.querySelectorAll('.playlist-item');
        const searchTerm = query.toLowerCase();

        items.forEach(item => {
            const title = item.querySelector('.playlist-item-title').textContent.toLowerCase();
            const artist = item.querySelector('.playlist-item-artist').textContent.toLowerCase();

            if (title.includes(searchTerm) || artist.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    filterTracks(genre) {
        const items = document.querySelectorAll('.playlist-item');

        // Update active filter button
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${genre}"]`).classList.add('active');

        items.forEach(item => {
            const trackId = parseInt(item.dataset.trackId);
            const track = this.playlist.find(t => t.id === trackId);

            if (genre === 'all' || track.genre.toLowerCase() === genre.toLowerCase()) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    removeTrack(trackId) {
        const trackIndex = this.playlist.findIndex(track => track.id === trackId);
        if (trackIndex !== -1) {
            // Remove from playlist array
            this.playlist.splice(trackIndex, 1);

            // Remove from DOM
            const playlistItem = document.querySelector(`[data-track-id="${trackId}"]`);
            if (playlistItem) {
                playlistItem.remove();
            }

            // Adjust current track if necessary
            if (trackIndex <= this.currentTrack && this.currentTrack > 0) {
                this.currentTrack--;
            }

            this.savePlaylistToStorage();
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        this.themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        localStorage.setItem('musicPlayerTheme', this.currentTheme);
    }

    showCreatePlaylistModal() {
        this.modal.style.display = 'block';
        document.getElementById('playlistName').focus();
    }

    hideModal() {
        this.modal.style.display = 'none';
        document.getElementById('playlistName').value = '';
    }

    createPlaylist() {
        const playlistName = document.getElementById('playlistName').value.trim();
        if (playlistName) {
            const playlistData = {
                name: playlistName,
                tracks: this.playlist,
                created: new Date().toISOString()
            };

            const savedPlaylists = JSON.parse(localStorage.getItem('musicPlayerPlaylists') || '[]');
            savedPlaylists.push(playlistData);
            localStorage.setItem('musicPlayerPlaylists', JSON.stringify(savedPlaylists));

            alert(`Playlist "${playlistName}" created successfully!`);
            this.hideModal();
        }
    }

    savePlaylist() {
        if (this.playlist.length === 0) {
            alert('No tracks in playlist to save!');
            return;
        }

        const playlistName = prompt('Enter playlist name:');
        if (playlistName) {
            const playlistData = {
                name: playlistName,
                tracks: this.playlist.map(track => ({
                    ...track,
                    file: null, // Don't save file objects
                    url: null // Don't save blob URLs
                })),
                created: new Date().toISOString()
            };

            const savedPlaylists = JSON.parse(localStorage.getItem('musicPlayerPlaylists') || '[]');
            savedPlaylists.push(playlistData);
            localStorage.setItem('musicPlayerPlaylists', JSON.stringify(savedPlaylists));

            alert(`Playlist "${playlistName}" saved successfully!`);
        }
    }

    loadPlaylist() {
        const savedPlaylists = JSON.parse(localStorage.getItem('musicPlayerPlaylists') || '[]');

        if (savedPlaylists.length === 0) {
            alert('No saved playlists found!');
            return;
        }

        let playlistOptions = savedPlaylists.map((playlist, index) =>
            `${index + 1}. ${playlist.name} (${playlist.tracks.length} tracks)`
        ).join('\n');

        const selection = prompt(`Select a playlist to load:\n\n${playlistOptions}\n\nEnter playlist number:`);

        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < savedPlaylists.length) {
                alert('Note: Loading saved playlists requires re-uploading the actual audio files.');
                // For demonstration, we'll just show the playlist structure
                const selectedPlaylist = savedPlaylists[index];
                console.log('Selected playlist:', selectedPlaylist);
            }
        }
    }

    handleKeyboardShortcuts(event) {
        // Don't trigger shortcuts when typing in input fields
        if (event.target.tagName === 'INPUT') return;

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.nextTrack();
                break;
            case 'KeyS':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.toggleShuffle();
                }
                break;
            case 'KeyR':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.toggleRepeat();
                }
                break;
        }
    }

    savePlaylistToStorage() {
        const playlistData = this.playlist.map(track => ({
            ...track,
            file: null, // Don't save file objects
            url: null // Don't save blob URLs
        }));
        localStorage.setItem('musicPlayerCurrentPlaylist', JSON.stringify(playlistData));
    }

    loadSavedData() {
        // Load theme
        const savedTheme = localStorage.getItem('musicPlayerTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            document.body.setAttribute('data-theme', this.currentTheme);
            this.themeToggle.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }

        // Set initial volume
        this.audio.volume = 0.5;

        // Load any saved playlist structure (files would need to be re-uploaded)
        const savedPlaylist = localStorage.getItem('musicPlayerCurrentPlaylist');
        if (savedPlaylist) {
            try {
                const playlistData = JSON.parse(savedPlaylist);
                // This would show the structure but require file re-upload for actual playback
                console.log('Previous playlist structure found:', playlistData);
            } catch (e) {
                console.log('No valid saved playlist found');
            }
        }
    }

    // Utility method to add sample tracks for demonstration
    addSampleTracks() {
        const sampleTracks = [{
                id: Date.now() + 1,
                title: 'Sample Rock Song',
                artist: 'Rock Artist',
                genre: 'rock',
                duration: 180,
                url: null
            },
            {
                id: Date.now() + 2,
                title: 'Sample Pop Song',
                artist: 'Pop Artist',
                genre: 'pop',
                duration: 210,
                url: null
            },
            {
                id: Date.now() + 3,
                title: 'Sample Jazz Song',
                artist: 'Jazz Artist',
                genre: 'jazz',
                duration: 240,
                url: null
            }
        ];

        sampleTracks.forEach(track => {
            this.playlist.push(track);
            this.addTrackToPlaylist(track);
        });
    }
}

// Initialize the music player when the page loads
let musicPlayer;

document.addEventListener('DOMContentLoaded', () => {
    musicPlayer = new MusicPlayer();

    // Add some sample tracks for demonstration (optional)
    // musicPlayer.addSampleTracks();

    console.log('Music Player initialized successfully!');
    console.log('Features available:');
    console.log('- Upload audio files using the upload button');
    console.log('- Use keyboard shortcuts: Space (play/pause), Arrow keys (prev/next)');
    console.log('- Search and filter tracks');
    console.log('- Create and save playlists');
    console.log('- Toggle dark/light theme');
    console.log('- Volume control and progress seeking');
});

// Make removeTrack function globally accessible
window.removeTrack = (trackId) => {
    musicPlayer.removeTrack(trackId);
};
