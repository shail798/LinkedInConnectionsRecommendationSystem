'use strict';
const _ = require('lodash');
// this is a function to add level to my users during bfs query
let k = 1;
function addLevel(userId) {
    let obj = {};
    obj.level = k;
    obj.user2 = userId;
    return obj;
  }
  const isStatic = true;
  
module.exports = function(Users) {
    // there are the endpoints that loopback provides and I want to disable the view 
    // when we open the swagger
    Users.disableRemoteMethodByName('find', isStatic);
    Users.disableRemoteMethodByName('replaceOrCreate', isStatic);
    Users.disableRemoteMethodByName('patchOrCreate', isStatic);
    Users.disableRemoteMethodByName('exists', isStatic);
    Users.disableRemoteMethodByName('findOne', isStatic);
    Users.disableRemoteMethodByName('deleteById', isStatic);
    Users.disableRemoteMethodByName('count', isStatic);
    Users.disableRemoteMethodByName('prototype.patchUserss', isStatic);
    Users.disableRemoteMethodByName('createChangeStream', isStatic);
    Users.disableRemoteMethodByName('updateAll', isStatic);
    Users.disableRemoteMethodByName('replaceById__post', isStatic);
    Users.disableRemoteMethodByName('replaceById', isStatic);
    Users.disableRemoteMethodByName('upsertWithWhere', isStatic);
    Users.disableRemoteMethodByName('patchById', isStatic);
    // bulk load to create 50000 users
    Users.bulkLoad = async () => {
        let finalInput = []
        for(let i=1;i<=50000;i++){
           let obj = {
               userId: i, name: 'user' + i, phone: '999' + i
           }
           finalInput.push(obj); 
        }
        try {
            await Users.create(finalInput);
            return 'User loaded successfully';
        }catch(err) {
            console.log('Error', JSON.stringify(err));
            throw 'Failed to load Users'
        }
    }
    Users.remoteMethod(
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

    // this is the method which is used to get the nth level friend, 
    // returns empty array if no friends exist at that level
    Users.getFriend = async (userId, level) => {
        try {
            let l = 1;
            let visited = [];
            visited.push(userId);
            var users = await Users.app.models.Friends.find({where: {user1: userId}, fields: {user2: true}});
            users = _.map(users, 'user2');
            // users now stores the first level friends of the userId given
            // visited array below is the map to see whether the friend has alredy visited
            visited = _.union(visited, users);
            // the below mapping adds the level to the users
            users = _.map(users, addLevel);
            let res = [];
            // will now use this users array as queue and visited as the map to check
            // BFS algorithm
            while(users.length > 0 && l <= level) {
                 let friendAtHead = users.shift();
                 l = Math.max(l, friendAtHead.level);
                 if(l == level)
                    res.push(friendAtHead.user2);
                 k = friendAtHead.level + 1;
                 var nextLevelUsers = await Users.app.models.Friends.find({where: {user1: friendAtHead.user2}, fields: {user2: true}});
                 nextLevelUsers = _.map(nextLevelUsers, 'user2');
                 // pulling out from the next level users that have already been visited
                 nextLevelUsers = _.pullAll(nextLevelUsers, visited);
                 visited = _.union(visited, nextLevelUsers);
                 // mapping the next level users with level key
                 nextLevelUsers = _.map(nextLevelUsers, addLevel);
                 // adding next level users to the queue
                 users = [...users, ...nextLevelUsers];
            }
            k = 1;
            return res; 
        } catch (error) {
            throw error;
        }
    };
    Users.remoteMethod(
        'getFriend', {
            http: {
                path: '/',
                verb: 'get'
            },
            accepts: [
                {arg: 'userId', type: 'number',http: {source: "query"}, required: true},
                {arg: 'level', type: 'number',http: {source: "query"}, required: true}
            ],
            returns: {
                type: 'string',
                root: true
            }   
        }
    )
};
// currently using the inbuild loopback post, but also wrote the 
// custom code that we could use to post which will ask for input as argument rather then JSON


   // Users.addUserToDb = (userId, name, phone, cb) => {
    //     Users.create({userId: userId, name: name, phone: phone}, (err, res) => {
    //     if(err)
    //         cb(err);
    //     else {
    //         cb(null, res);
    //     }
    //     });
    //  };
    // Users.remoteMethod(
    //     'addUserToDb', {
    //         http: {
    //             path: '/',
    //             verb: 'post'
    //         },
    //         accepts: [
    //             {arg: 'userId', type: 'number',http: {source: "query"}, required: true},
    //             {arg: 'name', type: 'string',http: {source: "query"}, required: true},
    //             {arg: 'phone', type: 'string',http: {source: "query"}, required: true}
    //         ],
    //         returns: {
    //             type: 'string',
    //             root: true
    //         }   
    //     }
    // )