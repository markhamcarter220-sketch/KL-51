
module.exports = function(err, req, res, next){
  console.error("KL25 ERROR:", err);
  res.status(err.status||500).json({
    ok:false,
    error: err.message || "internal_error",
    code: err.code || "ERR_GENERIC"
  });
};
