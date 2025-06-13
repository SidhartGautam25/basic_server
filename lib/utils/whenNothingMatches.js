function nothingMatches(res, res) {
  return res
    .status(404)
    .json({ msg: "no route handler to execute for this route" });
}

module.exports = nothingMatches;
