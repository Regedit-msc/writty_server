const Doc = require("../models/Document")


function paginatedDocs(searchParam) {
    return async (req, res, next) => {
        const docs = await Doc.find(searchParam)
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)

        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        const results = {}
        if (endIndex < await docs.length) {
            results.next = {
                page: page + 1,
                limit: limit
            }
        }

        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit: limit
            }
        }
        try {
            results.results = await Doc.find(searchParam).limit(limit).skip(startIndex).populate({ path: "user", select: "username profileImageUrl about userSkills" }).select('name user language private publicLink collabLink data theme comments likes createdAt').sort({ createdAt: 'desc' }).lean().exec()
            res.paginatedResults = results
            next()
        } catch (e) {
            res.status(200).json({ message: "Could not get codes.", success: false })
        }
    }
}
module.exports = { paginatedDocs }