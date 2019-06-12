'use strict';

// status.io

const Options = require('liqd-options');
const Timer = require('liqd-timer');
const Heartbeats = new Timer();
const OS = require('os');

const Beat = heartbeat => heartbeat.beat();

module.exports = class Heartbeat
{
	constructor( options, data = undefined )
	{
		this._options = Options( options,
		{
			url			: { _required: true, _type: 'string' },
			tls			: { _type: 'object' },
			name		: { _required: true, _type: 'string' },
			id			: { _required: true, _type: 'string' },
			interval 	: { _type: 'number', _default: 5000 },
		});

		this._header =
		{
			id: this._options.id,
			name: this._options.name,
			system:
			{
				platform: OS.platform(),
				version: OS.release(),
				arch: OS.arch(),
				hostname: OS.hostname(),
				username: OS.userInfo().username,
				node: process.versions.node,
				cpus: OS.cpus().length,
				ram: OS.totalmem()
			}
		};
		this._data = {};
		this._destroyed = false;

		this.beat();
	}

	update( data )
	{

	}

	beat()
	{
		let [ , protocol, host, port, path ] = this._options.url.match(/^(https{0,1}):\/\/([^\/:]+):*([0-9]*)(.*)$/) || [];

		let data = JSON.stringify( Object.assign({}, this._header, { data: this._data }));

		if( protocol, host )
		{
			this._data.ram = (( 1 - OS.freemem() / OS.totalmem()) * 100).toFixed(2) + ' %';

			const request = require( protocol ).request(
			{
				host,
				port: port || ( protocol === 'https' ? 443 : 80 ),
				path: path || '/',
				method: 'POST',
				headers:
				{
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength( data )
				}
			}, response =>
			{
				//console.log( 'Beat', this._options.name );

				if( !this._destroyed )
				{
					Heartbeats.set( this, Beat, this._options.interval, this );
				}
			});

			request.on( 'error', () =>
			{
				if( !this._destroyed )
				{
					Heartbeats.set( this, Beat, 1000, this );
				}
			});

			request.end( data );
		}
	}

	destroy()
	{
		this._destroyed = true;

		Heartbeats.clear( this );
	}
}
