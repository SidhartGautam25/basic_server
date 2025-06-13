export function errorOccured(err, req, res, next) {
  console.log("some error occured my friend");
  console.log("error is ", err);
  return;
}
