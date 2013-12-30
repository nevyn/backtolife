GetActiveEventsForCharacter = function(gameId, characterId) {
  return activeEvents = Events.find({
    game: gameId,
    character: characterId,
    state: {$ne: "completed"}
  });
}
