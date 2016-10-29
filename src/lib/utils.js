export function buildPrompt(movies) {
  const promptData = {
      searchResults: movies,
      yesAction  : 'addMovie',
      yesResponse: 'Added ' + movies[0].original_title + ' (' + movies[0].year + ')' + ' to your list of movies to download.'
  };

  if (movies.length > 1) {
    promptData.noAction = 'suggestNextMovie';
    promptData.noResponse = 'Ok, did you mean ' + movies[1].original_title + ' (' + movies[1].year + ')' + '?';
  }
  else {
    promptData.noAction = 'endSession';
    promptData.noResponse = 'Ok. I\'m out of suggestions. Sorry about that.';
  }

  return promptData;
}

export function sendSearchResponse(movies, movieName, resp) {
  if (!movies || !movies.length > 0) {
    return resp.say('No movie found for ' + movieName).send();
  }

  resp
    .say(['Add', movies[0].original_title, '(' + movies[0].year + ')', 'to your list?'].join(' '))
    .session('promptData', buildPrompt(movies))
    .shouldEndSession(false)
    .send();
}

export function formatSearchResults(movies) {
  const newMovies = [];

  if (movies != undefined) {
    for (let i = 0; i < movies.length; i++) {
      newMovies.push({
        original_title: movies[i].original_title,
        in_library: movies[i].in_library,
        year: movies[i].year,
        titles: movies[i].titles,
        imdb: movies[i].imdb
      });
    }
  }

  return newMovies;
}