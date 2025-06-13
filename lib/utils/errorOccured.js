function errorOccured(err, req, res, next) {
  console.log("some error occured my friend");
  return;
}

module.exports = errorOccured;
