/*
 * LICENSE AND COPYRIGHT
 *
 * Copyright (C) 2012 Eric Wolf
 * This module is free software; it can be used under the terms of the artistic license
 *
 * Here are the following public yote calls :
 *  * init           - takes the url of the yote relay cgi and sets it for all yote calls
 *  * reload_all     - reloads all yote objects that are in the yote queue
 *  * create_account - sets the login token
 *  * login          - sets the login token
 *  * fetch_root     - returns a yote object (uses login token)
 *  * methods attached to yote object :
 *    ** reload - refreshes the data of this object with a call to the server
 *    ** get(field) - returns a yote object or a scalar value attached to this yote object (uses login token)
 *    ** any method defined on the server side, which returns a yote object or a scalar value (uses login token)
 */
Object.keys = Object.keys || (function () {
	var hasOwnProperty = Object.prototype.hasOwnProperty;

	return function (o) {
	    if (typeof o != "object" && typeof o != "function" || o === null)
		    throw new TypeError("Object.keys called on a non-object");

	    var result = [];
	    for (var name in o) {
		    if (hasOwnProperty.call(o, name))
		        result.push(name);
	    }

	    return result;
	};
})();
$.yote = {
    token:null,
    err:null,
    url:'/cgi-bin/yote/yote.cgi',
    objs:{},

    init:function(url) {
        this.url = url;
        return this;
    },

    reload_all:function() { //reloads all objects
	    for( id in this.objs ) {
	        this.objs[id].reload();
	    }
    },

    create_obj:function(data,appname) {
	    var root = this;
	    return (function(x,an) {
	        var o = {
		        _app:an,
		        _d:{},
		        id:x.id,
		        reload:function(){},
		        length:function() {
		            var cnt = 0;
		            for( key in this._d ) {
			            ++cnt;
		            }
		            return cnt;
		        }
	        };

	        /*
	          assign methods
	        */
	        if( typeof x.m === 'object' ) {
		        for( m in x.m ) {
		            o[x.m[m]] = (function(key) {
			            return function( params, passhandler, failhandler ) {
				            var ret = root.message( {
				                app:o._app,
				                cmd:key,
				                data:params,
				                wait:true,
				                async:false,
				                failhandler:failhandler,
				                passhandler:passhandler
				            } ); //sending message
			                
				            if( typeof ret.r === 'object' ) {
				                return root.create_obj( ret.r, o._app );
				            } else {
                                if( typeof ret.r === 'undefined' ) {
                                    if( typeof failhandler === 'function' ) {
                                        failhandler();
                                    }
                                    return undefined;
                                }
				                return ret.r;
				            }
			            } } )(x.m[m]);
		        } //each method
	        } //methods

	        // get fields
	        if( typeof x.d === 'object' ) {
		        for( fld in x.d ) {
		            var val = x.d[fld];
		            if( typeof val === 'object' ) {
			            o._d[fld] = (function(x) { return root.create_obj(x); })(val);
		            } else {
			            o._d[fld] = (function(x) { return x; })(val);
		            }
		        }
	        }

	        o.get = function( key ) {
		        var val = this._d[key];
		        if( typeof val === 'undefined' ) return false;
		        if( typeof val === 'object' ) return val;
		        if( (0+val) > 0 ) {
		            return root.fetch_obj(val,this._app);
		        }
		        return val.substring(1);
	        }

	        if( (0 + x.id ) > 0 ) {
		        root.objs[x.id] = o;
		        o.reload = (function(thid,tapp) {
		            return function() {
			            root.objs[thid] = null;
			            var replace = root.fetch_obj( thid, tapp );
			            this._d = replace._d;
			            return this;
		            }
		        } )(x.id,an);
	        }
	        return o;
        })(data,appname);
    }, //create_obj

    fetch_obj:function(id,app) {
	    if( typeof this.objs[id] === 'object' ) {
	        return this.objs[id];
	    }
	    return this.create_obj( this.message( {
	        app:app,
	        cmd:'fetch',
	        data:{ id:id },
	        wait:true,
	        async:false,
	    } ).r, app );
    },

    get_app:function( appname,passhandler,failhandler ) {
        var res = this.message( {
	        app:appname,
	        cmd:'fetch_root',
	        data:{ app:appname },
	        wait:true,
	        async:false,
            failhandler:failhandler,
            passhandler:passhandler
	    } );
        if( typeof res.r === 'undefined' ) {
            return undefined;
        } 
	    return this.create_obj(  res.r, appname );
    },

    logout:function() {
	this.token = undefined;
	this.acct = undefined;
    }, //logout

    get_account:function() {
	return this.acct;
    },

    is_logged_in:function() {
	return typeof this.acct === 'object';
    }, //is_logged_in


    /*   DEFAULT FUNCTIONS */
    login:function( un, pw, passhandler, failhandler ) {
	    var root = this;
	    this.message( {
            cmd:'login', 
            data:{
                h:un,
                p:pw
            },
            wait:true, 
            async:false,
            passhandler:function(data) {
	        root.token = data.t;
		root.acct = data.a;
		if( typeof passhandler === 'function' ) {
			passhandler(data);
		}
	    },
            failhandler:failhandler
        } );
    }, //login

    // generic server type error
    error:function(msg) {
        console.dir( "a server side error has occurred : " + $.dump(msg) );
    },
    
    create_account:function( un, pw, em, passhandler, failhandler ) {
	var root = this;
        this.message( {
            cmd:'create_account', 
            data:{
                h:un,
                p:pw,
                e:em
            },
            wait:true, 
            async:false,
            passhandler:function(data) {
	        root.token = data.t;
		root.acct = data.a;
		if( typeof passhandler === 'function' ) {
			passhandler(data);
		}
	    },
            failhandler:failhandler
        } );
    }, //create_account

    recover_password:function( em, from_url, to_url, passhandler, failhandler ) {
	    var root = this;
        this.message( {
            cmd:'recover_password', 
            data:{
		        e:em,
		        u:from_url,
                t:to_url
            },
            wait:true, 
            async:false,
	        passhandler:passhandler,
            failhandler:failhandler
        } );
    }, //recover_password

    reset_password:function( token, newpassword, passhandler, failhandler ) {
	    var root = this;
        this.message( {
            cmd:'reset_password', 
            data:{
		        t:token,
		        p:newpassword	
            },
            wait:true, 
            async:false,
	        passhandler:passhandler,
            failhandler:failhandler
        } );
    }, //reset_password
    
    remove_account:function( un, pw, em, passhandler, failhandler ) {
	var root = this;
        this.message( {
            cmd:'remove_account', 
            data:{
                h:un,
                p:pw,
                e:em
            },
            wait:true, 
            async:false,
            passhandler:function(data) {
	            root.token = data.t;
		        if( typeof passhandler === 'function' ) {
			        passhandler(data);
		        }
	        },
            failhandler:failhandler
        } );
    }, //remove_account

    translate_data:function(data) {
        return data;
        if( typeof data === 'object' ) {
            if( data.id > 0 && typeof data._d !== 'undefined' ) {
                return data.id;
            }
            var ret = Object();
            for( var key in data ) {
                ret[key] = this.translate_data( data[key] );
            }
            return ret;
        }
        return 'v' + data;
    }, //translate_data

	/* general functions */
    message:function( params ) {
        var root = this;
        var data = root.translate_data( params.data );
        async = params.async == true ? 1 : 0;
		wait  = params.wait  == true ? 1 : 0;
        var enabled;
        if( async == 0 ) {
            enabled = $(':enabled');
            $.each( enabled, function(idx,val) { val.disabled = true } );
        }
	    var resp;
	    $.ajax( {
	        async:async,
	        data:{
		        m:$.base64.encode(JSON.stringify( {
		            a:params.app,
		            c:params.cmd,
		            d:data,
		            t:root.token,
		            w:wait
		        } ) ) },
	        dataFilter:function(a,b) { 
		        return a; 
	        },
	        error:function(a,b,c) { root.error(a); },
	        success:function( data ) {
                if( typeof data !== 'undefined' ) {
		            resp = data; //for returning synchronous
		            if( typeof data.err === 'undefined' ) {
		                if( typeof params.passhandler === 'function' ) {
			                params.passhandler(data);
		                }
		            } else if( typeof params.failhandler === 'function' ) {
		                params.failhandler(data.err);
		            } else { 
                        console.dir( "Invalid failhandler given. It is type " + typeof params.failhandler + ',' + '. call was : ' + $.dump({
		                    a:params.app,
		                    c:params.cmd,
		                    d:data,
		                    t:root.token,
		                    w:wait
		                }) );
                    } //error case. no handler defined alert ("Dunno : " + typeof params.failhandler ) }
                } else {
                    console.dir( "Success reported but no response data received" );
                }
	        },
	        type:'POST',
	        url:root.url
	    } );
        if( async == 0 ) {
            $.each( enabled, function(idx,val) { val.disabled = false } );
            return resp;
        }
    } //message
}; //$.yote


