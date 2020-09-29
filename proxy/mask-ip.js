function maskRemoteAddress(req) {
    var v4parts = req.remoteAddress.split('.')
    v4parts[3] = 0
    return v4parts.join('.')
}
