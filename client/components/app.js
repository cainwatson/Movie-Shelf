angular.module('movie-shelf')
  .component('app', {
    controller: function controller(TheMovieDB, $sce) {
      this.movies = [];
      this.moviesDB = [];
      this.shelf = [];
      this.upcoming = [];
      this.nowPlaying = [];
      this.loading = {
        nowPlaying: false,
        upcoming: false,
      };
      this.user = null;
      this.views = {
        topMovies: false,
        myShelf: false,
        newMovies: false,
        searched: true,
      };
      $(document).ready(() => $('.tabs').tabs());
      this.toggleView = (view) => {
        Object.keys(this.views).forEach((key) => {
          this.views[key] = false;
        });
        this.views[view] = true;
      };

      this.toggleLoading = (item) => {
        Object.keys(this.loading).forEach((key) => {
          this.loading[key] = false;
        });
        if (Array.isArray(item)) {
          item.forEach((loadingItem) => {
            this.loading[loadingItem] = true;
          });
        } else {
          this.loading[item] = true;
        }
      };

      this.searchResults = (data) => {
        this.movies = data.results;
      };

      this.authenticated = false;

      this.changeAuth = (data) => {
        if (data.user) {
          this.user = data.user;
          this.authenticated = true;
          this.user.favorites.map(movie => TheMovieDB.getMovie(movie.movieId)
            .then(res => this.pushit(res))
            .catch(err => console.error(err)));
        }
        return this.authenticated;
      };

      this.handleNewUpcoming = () => {
        this.toggleView('newMovies');
        this.toggleLoading(['nowPlaying', 'upcoming']);
        TheMovieDB.getUpcoming()
          .then(response => this.getDetailsFromIDs(response, 'upcoming', null, 'upcoming'))
          .catch(err => console.log(err));
        TheMovieDB.getNowPlaying()
          .then(response => this.getDetailsFromIDs(response, 'nowPlaying', null, 'nowPlaying'))
          .catch(err => console.log(err));
      };

      this.toggleErrorWait = () => {
        this.errorWait = true;
        setTimeout(() => {
          this.errorWait = false;
        }, 10000);
      };

      this.getDetailsFromIDs = (movies, destination, view, loading) => {
        if (view) {
          this.toggleView(view);
        }
        // reset moviesDB state;
        this.moviesDB = [];
        movies.forEach((movie) => {
          const {
            id,
            title,
            overview,
            release_date,
            poster_path,
          } = movie;
          const movieDetails = {};
          movieDetails.id = id;
          movieDetails.title = title;
          movieDetails.overview = overview;
          movieDetails.releaseDate = release_date;
          if (poster_path) {
            movieDetails.posterUrl = `http://image.tmdb.org/t/p/w200${poster_path}`;
          }
          TheMovieDB.searchVideos(id)
            .then((videos) => {
              const youtubeVids = videos.filter(video => video.site === 'YouTube');
              if (youtubeVids.length > 0) {
                movieDetails.hasMedia = true;
              }
              youtubeVids.forEach((video) => {
                video.embededLink = $sce.trustAsResourceUrl(`https://www.youtube.com/embed/${video.key}`);
              });
              movieDetails.videos = youtubeVids;
            })
            .catch((err) => {
              if (err.data.error === 'Request failed with status code 429' && !this.errorWait) {
                M.toast({ html: 'Failed to load all videos, try again in 10seconds' });
                this.toggleErrorWait();
              }
            });
          TheMovieDB.searchCast(id)
            .then((credits) => {
              const director = credits.crew.filter(member => member.job === 'Director');
              movieDetails.credits = credits;
              movieDetails.director = director;
            })
            .catch((err) => {
              if (err.data.error === 'Request failed with status code 429' && !this.errorWait) {
                M.toast({ html: 'Failed to load all directors, try again in 10seconds' });
                this.toggleErrorWait();
              }
            });
          this[destination].push(movieDetails);
        });
        this.loading[loading] = false;
      };

      this.pushit = (movie) => {
        this.shelf.unshift(movie);
      };

      this.spliceit = (movie) => {
        const i = this.shelf.indexOf(movie);
        this.shelf.splice(i, 1);
      };
    },

    templateUrl: '/templates/app.html',

  });
