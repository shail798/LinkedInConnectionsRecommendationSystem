'use strict';

var _ = require('lodash');
const isStatic = true;

module.exports = function(Blogs) {
    Blogs.disableRemoteMethodByName('replaceOrCreate', isStatic);
    Blogs.disableRemoteMethodByName('patchOrCreate', isStatic);
    Blogs.disableRemoteMethodByName('exists', isStatic);
    Blogs.disableRemoteMethodByName('findOne', isStatic);
    Blogs.disableRemoteMethodByName('deleteById', isStatic);
    Blogs.disableRemoteMethodByName('count', isStatic);
    Blogs.disableRemoteMethodByName('prototype.patchBlogss', isStatic);
    Blogs.disableRemoteMethodByName('createChangeStream', isStatic);
    Blogs.disableRemoteMethodByName('updateAll', isStatic);
    Blogs.disableRemoteMethodByName('replaceById__post', isStatic);
    Blogs.disableRemoteMethodByName('replaceById', isStatic);
    Blogs.disableRemoteMethodByName('upsertWithWhere', isStatic);
    Blogs.disableRemoteMethodByName('patchById', isStatic);
    
    Blogs.bulkLoad = async () => {
        let finalInput = []
        for(let i=1;i<=30000;i++){
           let obj = {
               blogId: i, title: 'blog' + i, text: 'Content for blog' + i
           }
           finalInput.push(obj); 
        }
        try {
            await Blogs.create(finalInput);
            return 'Blogs loaded successfully';
        }catch(err) {
            console.log('Error', JSON.stringify(err));
            throw 'Failed to load Blogs'
        }
    }
    Blogs.remoteMethod(
        'bulkLoad', {
            http: {
                path: '/bulkLoad',
                verb: 'post'
            },
            returns: {
                type: 'string',
                root: true
            }   
        }
    )
    Blogs.common = async (blogId) => {
        try {
        let blog = await Blogs.findOne({where: {blogId: blogId}, fields: {users: true}});
        let users = blog.users;
        if(users == null || users.length < 1)
            return "this blog does not have any users who have commented on it";
        let query = {"where": {"users": {inq: users}}, fields: {"title": true, "text": true}};
        return await Blogs.find(query);
        } catch (error) {
            throw error;    
        }
    };
    Blogs.remoteMethod(
        'common', {
            http: {
                path: '/common',
                verb: 'get'
            },
            accepts: {
                arg: 'blogId', type: 'number', required: true
            },
            returns: {
                type: 'string',
                root: true
            }   
                
        }
    )
};