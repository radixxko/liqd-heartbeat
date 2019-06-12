'use strict';

const Server = require('liqd-server');
const Cache = require('liqd-cache');
const Template = require('liqd-template');
const Heartbeat = require('../lib/heartbeat');

const clients = new Cache();
const server = new Server();
const ui = new Template({ directory: __dirname + '/templates' });

const Panic = ( id, data ) =>
{
	console.log( 'No hearbeat from', id, data );
}

server.post( '/heartbeat', ( req, res, next ) =>
{
	res.status( 200 ).end();

	clients.set( req.body.id, Object.assign({ ip: req.headers['x-forwarded-for'] || req.request.connection.remoteAddress, updated: new Date().getTime() }, req.body ), 3000, Panic );
});

server.get( '/status', async( req, res, next ) =>
{
	//res.reply( '<!DOCTYPE html>' + JSON.stringify([...clients.keys()].reduce(( c, id ) => ( c[id] = clients.get( id )) && c, {}), null, '  '));
	res.reply( '<!DOCTYPE html>' + await ui.render('overview', {clients: [...clients.keys()].reduce(( c, id ) => ( c[id] = clients.get( id )) && c, {})}), 'text/html' );
});

server.listen( 8080 );

const heartbeat = new Heartbeat(
{
	url		: 'http://localhost:8080/heartbeat',
	name	: 'haha',
	id		: 'haha',
	interval: 1000
});

const heartbeat2 = new Heartbeat(
{
	url		: 'http://localhost:8080/heartbeat',
	name	: 'Test 2',
	id		: 'test-231',
	interval: 1500
});

const heartbeat3 = new Heartbeat(
{
	url		: 'http://localhost:8080/heartbeat',
	name	: 'Test 3',
	id		: 'test-312',
	interval: 2000
});
