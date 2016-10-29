'use strict';

import CouchPotato from 'node-couchpotato';
import utils from './utils.js';

const WELCOME_DESCRIPTION = 'This skill allows you to manage your Couch Potato movie list.';
const HELP_RESPONSE = ['You can ask Couch Potato about the movies in your queue or add new movies',
    'to it. Try asking "is The Godfather on the list?". If it\'s not and you want to add it, try',
    'saying "add The Godfather".'].join(' ');
var CANCEL_RESPONSE = 'Exiting Couch Potato';

const config = require('dotenv').config();
const cp = new CouchPotato({
  url: config.CP_URL,
  apikey: config.CP_API_KEY,
  debug:true
});

export default function handleLaunchIntent(req, resp) {
  resp
    .say(WELCOME_DESCRIPTION)
    .say(HELP_RESPONSE)
    .send();
}

export function handleFindMovieIntent(req, resp) {
  const movieName = req.slot('movieName');

  cp.movie.list({search: movieName, limit_offset: 5}).then(function (searchResp) {
    const movies = searchResp.movies;

    if (!movies || !movies.length) {
      resp.say('Couldn\'t find ' + movieName + ' queued for download. ');

      cp.movie.search(movieName).then(function (searchResults) {
	utils.sendSearchResponse(searchResults, resp);
      });
    }
    else {
      const result = movies[0].info;
      resp
	.say([
	  'It looks like', result.original_title,
	  '(' + result.year + ')', 'is already on your list.'
	].join(' '))
	.send();
    }
  });

  //Async response
  return false;
}

export function handleAddMovieIntent(req, resp) {
  var movieName = req.slot('movieName');

 cp.movie.search(movieName,5).then(function (movies) {
   movies = utils.formatSearchResults(movies);
   utils.sendSearchResponse(movies, movieName, resp);
 });

  //Async response
  return false;
}

export function handleYesIntent(req, resp) {
  const promptData = req.session('promptData');

  if (!promptData) {
    console.log('Got a AMAZON.YesIntent but no promptData. Ending session.');
    resp.send();
  }
  else if (promptData.yesAction === 'addMovie') {
    const movie = promptData.searchResults[0];

    cp.movie.add({
      title: movie.titles[0],
      identifier: movie.imdb
    }).then(function () {
      resp
	.say(promptData.yesResponse)
	.send();
    });

    //Async response
    return false;
  }
  else {
    console.log("Got an unexpected yesAction. PromptData:");
    console.log(promptData);
    resp.send();
  }
}

export function handleNoIntent(req, resp) {
  const promptData = req.session('promptData');

  if (!promptData) {
    console.log('Got a AMAZON.YesIntent but no promptData. Ending session.');
    resp.send();
  }
  else if (promptData.noAction === 'endSession') {
    resp.say(promptData.noResponse).send();
  }
  else if (promptData.noAction === 'suggestNextMovie') {
    const movies = promptData.searchResults;
    resp
      .say(promptData.noResponse)
      .session('promptData', utils.buildPrompt(movies.slice(1)))
      .shouldEndSession(false)
      .send();
  }
  else {
    console.log("Got an unexpected noAction. PromptData:");
    console.log(promptData);
    resp.send();
  }
}

export function handleCancelIntent(req, resp) {
  resp.say(CANCEL_RESPONSE).shouldEndSession(true).send();
}

export function handleHelpIntent(req, resp) {
  resp.say(HELP_RESPONSE).send();
}
