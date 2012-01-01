$.gServ = {
    token:null,
    err:null,
    url:null,
    objs:{},

    init:function(url) {
        this.url = url;
        return this;
    },

    get_app:function(appname) {
        return this.fetch(appname);
    },

    reload:function() { //reloads all objects
	for( id in this.objs ) {
	    this.objs[id].reload();
	}
    },

    fetch:function(appname,id,app) {
        var root = this;

	if( id > 0 )  {
	    if( typeof root.objs[id] === 'object' ) {
		return root.objs[id];
	    }
	}

	var async = false;

	var wait  = true;

        if( typeof app === 'undefined' ) {
            app = {};
        }
        if( id > 0 ) {
            var cmd = 'fetch';
        } else {
            var cmd = 'fetch_root';
        }
        var data = root.message( {
            cmd:cmd,
            data:{
                app:appname,
                id:id
            },
            wait:wait,
            async:async,
            failhandler:root.error,
            passhandler:function(appdata) {
                app.id    = appdata.id;
                app.app   = appdata.a;
		app['class'] = appdata.c;
		if( appdata.c === 'ARRAY' ) {
		    app._data = [];
		} else if( appdata.c === 'HASH' ) {
		    app._data = {};
		}
                app.reload = function() { root.objs[this.id] = null; return root.fetch(0,this.id,this) };
		if( typeof appdata.m === 'object' ) {
		    for( var i=0; i< appdata.m.length; i++ ) {
			app[appdata.m[i]] = (function(key) {
						 return function( params, extra ) {
						     var ret;
						     var async = false;
						     var wait = true;
						     var failhandler = root.error;
						     if( typeof extra === 'object' ) {
							 async = typeof extra.async === 'undefined' ? false : extra.async;
							 wait  = typeof extra.wait  === 'undefined' ? true  : extra.wait;
							 failhandler = typeof extra.failhandler === 'undefined' ? root.error : extra.failhandler;
						     }
						     root.message( {
							     app:app.app,
								 cmd:key,
								 data:params,
								 wait:wait,
								 async:async,
								 failhandler:failhandler,
								 passhandler:function(res) {
								 ret = res.r;
							     }
							 } );
						     return ret;
						 } } )(appdata.m[i]);
		    } //each m
		}
                for( field in appdata.d ) {
		    var func;
                    if( appdata.d[field] > 0 ) {
			    func = (function(id,fld) { 
                                return function() {
				    var obj = root.fetch(0,id,{});
				    this['get_'+fld] = (function(x) { return function() { return x; } } )(obj);
				    return obj;
                                } 
                            })(appdata.d[field],field);
                    } else {
                        func = (function(val) { 
                            return function() { 
                                 return val; 
                            } 
                        })(appdata.d[field].substring(1));
                    }
		    if( app.class === 'ARRAY' || app.class === 'HASH' ) {
			app._data[field] = func(); //calling this changes app due to javascript scoping rules.
		    } else { //gserv object
			app['get_'+field] = func;
		    }                    
                } //each d
		if( app.class === 'ARRAY' || app.class === 'HASH' ) {
		    alert( "eep" );
		    app = app._data;
		}
            }
        } );
        return app;
    }, //fetch
    
	/*   DEFAULT FUNCTIONS */
    login:function( un, pw, passhandler, failhandler ) {
        this.message( {
            cmd:'login', 
            data:{
                h:un,
                p:pw
            },
            wait:true, 
            async:false,
            passhandler:passhandler,
            failhandler:failhandler
        } );
    }, //login

    // generic server type error
    error:function(msg) {
        alert( "a server side error has occurred : " + $.dump(msg) );
    },
    
    create_account:function( un, pw, em, passhandler, failhandler ) {
        this.message( {
            cmd:'create_account', 
            data:{
                h:un,
                p:pw,
                e:em
            },
            wait:true, 
            async:false,
            passhandler:passhandler,
            failhandler:failhandler
        } );
    }, //create_account

	/* general functions */
    message:function( params ) {
        var root = this;
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
                    d:params.data,
                    t:root.token,
                    w:wait
			    } ) ) },
		    error:function(a,b,c) { root.error(a) },
		    success:function( data ) {
			    resp = data;
                if( typeof data.err === 'undefined' ) {
                    if( typeof params.passhandler === 'function' ) {
                        params.passhandler(data);
                    }
                } else if( typeof params.failhandler === 'function' ) {
                    params.failhandler(data);
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
}; //$.gServ

