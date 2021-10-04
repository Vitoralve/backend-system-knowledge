const { updateLocale } = require("moment-timezone")

module.exports = app =>{
    const{ existOrError, notExistsOrError } = app.api.validation

    const save = (req, res) =>{
        const category = {... req.body}
        if(req.params.id) category.id = req.params.id


        try{
            existOrError(category.name, 'Nome não informado')
        }catch{
            return res.status(400).send(msg)
        }

        if(category.id){
            app.db('categories')
            .update(category)
            .where({id: category.id})
            .then(_ => res.status(204).send())
            .catch(err => res.status(500).send(err))
        }else{
            app.db('categories')
                .insert(category)
                .then(_ => res.status(204).send())
                .catch(err => res.status(500).send(err))
        }
    }

    const remove = async (req, res) =>{
        try {
            existOrError(req.params.id, 'Codigo da categoria não informado')

            const subcategory = await app.db ('categories')
                .where({ parentId: req.params.id})
            notExistsOrError(subcategory, 'Categoria possui subcategorias.')

            const articles = await app.db('articles')
                .where({categoryId: req.params.id})
            notExistsOrError(articles, 'Caregoria possui artigos.')

            const rowsDeleted = await app.db('categories')
                .where({id: req.params.id}).del()
            existOrError(rowsDeleted, 'Categoria não foi encontrada.')
            

            res.status(204).send()
        }catch(msg){
            res.status(400).send(msg)
        }
    }

    const withPath = categories => {
        const getParent = (categories, parentId) =>{
            const parent = categories.filter(parent => parent.id === parentId)
            return parent.length ? parent[0]  : null
        }
        
        const categorieswithPath = categories.map(category =>{
            let path = category.name
            let parent = getParent(categories, category.parentId)

            while(parent){
                path = `${parent.name} > ${path}`
                parent = getParent(categories, parent.parentId)
            }   

            return { ...category, path}
        })

        categorieswithPath.sort((a,b)=>{
            if(a.path < b.path) return -1
            if(a.path > b.path) return 1
            return 0
        })

        return categorieswithPath
    }

    const get = (req, res) => {
        app.db('categories')
            .then(categories => res.json(withPath(categories)))
            .catch(err => res.status(500).send(err))
    }

    const getById = (req, res) =>{
        app.db('categories')
            .where({id: req.params.id})
            .then(category => res.json(category))
            .catch(err => res.status(500).send(err))
    }

    // const toTree = (){

    // }

    return {save, remove, get, getById}
}