var Warframe = require("./index"),
    warframe = new Warframe({ storeAccount: true }),
	config = require("./logindata.json"),
	express = require("express"),
    app = express(),
    engines = require("consolidate"),
    assert = require("assert"),
    fsPath = require("fs-path"),
	bodyParser = require("body-parser"),
	fs = require("fs"),
	moment = require("moment");

warframe.login(config.login.username, config.login.password, function(res){
	
	// show login info
	console.log(res);
	
	// init global vars
	var buttons = "";
	var buttons2 = "";
	var userName;
	var file1;
	var file2;
	var json1;
	var json2;
	var list = "";
	var collectlog = "";
	var watchlist = JSON.parse(fs.readFileSync("./watchlist.json"));
	console.log("reading watchlist.json");
	
	// date library	
	moment.locale("de");
	
	// express variables
	app.engine("html", engines.nunjucks);
	app.set("view engine", "html");
	app.set("views", __dirname + "/views");
	app.use(bodyParser());
	app.use("/public", express.static(__dirname + "/public"));
	app.use("/js", express.static(__dirname + "/views/js"));
	app.use("/css", express.static(__dirname + "/views/css"));
	app.use("/fonts", express.static(__dirname + "/views/fonts"));
	
	// response on "/" query
	app.get("/", function(req, res){
		
		console.log('rendering "/"');
		
		// resetting the vars for new query
		buttons = "";
		buttons2 = "";
		list = "";
		userName = "";
		file1 = "";
		file2 = "";
		json1 = "";
		json2 = "";
		collectlog = "";
		
		// reading all folders withing userdata
		var dirs = fs.readdirSync(__dirname+"/userdata/");
		
		// preparing the list of li items within the userlist
		dirs.forEach(function(dir) {
			list = list+"<li class='directory'><span>"+dir+"<span></li>";
		});
		
		var html7 =  "<!DOCTYPE html>"+
					"<html lang='en'>"+
					"<head>"+
							"<style>"+
							"html, body { height: 100% }"+
							"</style>"+
							"<meta content='text/html;charset=utf-8' http-equiv='Content-Type'>"+
							"<meta http-equiv='X-UA-Compatible' content='IE=edge'>"+
							"<meta name='viewport' content='width=device-width, initial-scale=1'>"+
							"<title>WarframeCompare</title>"+
							"<link rel='stylesheet' href='css/style.css' type='text/css' media='screen' />"+
							"<link rel='stylesheet' href='css/bootstrap.min.css' type='text/css' media='screen' />"+
						"</head>"+
						"<body>"+
							"<div id='collect'>"+
								"<a id='collectguild' href='/collectguild'>Guilddata</a>"+
								"<a id='collectwatchlist' href='/collectwatchlist'>Watchlist</a>"+
							"</div>"+
							"<h2 id='logo'>WarframeCompare</h2>"+
							"<div id='filelist'>"+
								"<ul id='tester' class='list-unstyled'>"+
									list +
								"</ul>"+
							"</div>"+
							"<div>"+
								"<form class='input-group' id='test' action='/' method='post'>"+
									"<input class='form-control' type='text' name='userName' placeholder='username'>"+
									"<span class='input-group-btn'>"+
										"<button id='test2' class='btn btn-secondary' type='submit'>search</button>"+
									"</span>"+
								"</form>"+
							"</div>"+
							
							"<script src='js/jquery-3.1.1.min.js'></script>"+
							"<script src='js/bootstrap.min.js'></script>"+
							"<script src='js/main.js'></script>"+
						"</body>"+
					"</html>";
		
		// writing the html
		res.write(html7);
		// setting the status code
		res.status(200);
		// ending the stream
		res.end();
	});
	
	// request from "/"
	app.post("/", function(req, res){
		userName = req.body.userName;
		console.log("requested name: "+userName);
		res.redirect("/select");
	});
	
	app.get("/collectguild", function(req, res){
		
		try {
		
			warframe.getGuild(function(view){
				
				var guild = JSON.parse(view);
				
				guild.Members.forEach(function(member){
					
					warframe.viewPlayer(config.login.username, config.login.password, member._id.$id, function(data){
						
						var playerinfo = JSON.parse(data);
						
						playerinfo.DisplayName = member.DisplayName;
						playerinfo.id = member._id.$id;
						
						if (member.DisplayName.endsWith(".")) {
							var memberName = member.DisplayName.substring(0, member.DisplayName.length - 1);
						} else {
							var memberName = member.DisplayName;
						}
						collectlog = collectlog+"collecting: \n username: " + member.DisplayName + "\n id:" + member._id.$id + "\n";
						console.log("collecting:");
						console.log("\"username\": " + "\"" + member.DisplayName + "\"");
						console.log("\"id\": " + "\"" + member._id.$id + "\"");
						
						var path = "/userdata/"+memberName+"/"+moment().format("DD MMMM YYYY, HH-mm")+".json";
						
						fsPath.writeFile(__dirname+path, JSON.stringify(playerinfo), function(err) {
							if(err) {
								return console.log(err);
							}
							console.log(__dirname+path+" saved.\n");
						});
						
					});
					
				});
				
			});
			
		} catch (e) {
			console.log("login invalid, try again!");
		}
			
		var html8 =  "<!DOCTYPE html>"+
					"<html lang='en'>"+
					"<head>"+
							"<meta content='text/html;charset=utf-8' http-equiv='Content-Type'>"+
							"<meta http-equiv='X-UA-Compatible' content='IE=edge'>"+
							"<meta name='viewport' content='width=device-width, initial-scale=1'>"+
							"<title>Guilddata</title>"+
							"<link rel='stylesheet' href='css/style.css' type='text/css' media='screen' />"+
							"<link rel='stylesheet' href='css/bootstrap.min.css' type='text/css' media='screen' />"+
						"</head>"+
						"<body>"+						
							"<div class='wrapper'>"+
								"<div id='collectlog'>"+
									"<pre id='codepre'>"+
										collectlog +
									"</pre>"+
								"</div>"+
								"<form class='input-group' id='collect' action='/collectguild' method='post'>"+
									"<button class='btn btn-secondary' type='submit'>back</button>"+
								"</form>"+
							"</div>"+
							"<script src='js/jquery-3.1.1.min.js'></script>"+
							"<script src='js/bootstrap.min.js'></script>"+
							"<script src='js/main.js'></script>"+
						"</body>"+
					"</html>";
		
		
		console.log(collectlog);
		// writing the html
		res.write(html8);
		// setting the status code
		res.status(200);
		// ending the stream
		res.end();
	});
	
	// request from "/collect"
	app.post("/collectguild", function(req, res){
		res.redirect("/");
	});
	
	app.get("/collectwatchlist", function(req, res){
		
		watchlist.forEach(function(user){
					
			try { 
				
				warframe.viewPlayer(config.login.username, config.login.password, user.id, function(data){
					
					var playerinfo = JSON.parse(data); 
					
					playerinfo.DisplayName = user.DisplayName;
					playerinfo.id = user.id;
					
					if (user.DisplayName.endsWith(".")) {
						var memberName = user.DisplayName.substring(0, user.DisplayName.length - 1);
					} else {
						var memberName = user.DisplayName;
					}
					collectlog = collectlog+"collecting: \n username: " + user.DisplayName + "\n id:" + user.id + "\n";
					console.log("collecting:");
					console.log("\"username\": " + "\"" + user.DisplayName + "\"");
					console.log("\"id\": " + "\"" + user.id + "\"");
					
					var path = "/userdata/"+memberName+"/"+moment().format("DD MMMM YYYY, HH-mm")+".json";
					
					fsPath.writeFile(__dirname+path, JSON.stringify(playerinfo), function(err) {
						if(err) {
							return console.log(err);
						}
						console.log(__dirname+path+" saved.\n");
					});
					
				});
				
			} catch (e) {
				console.log("login invalid, try again!");
			}
				
		});
		
		var watchlistpage =  "<!DOCTYPE html>"+
					"<html lang='en'>"+
					"<head>"+
							"<meta content='text/html;charset=utf-8' http-equiv='Content-Type'>"+
							"<meta http-equiv='X-UA-Compatible' content='IE=edge'>"+
							"<meta name='viewport' content='width=device-width, initial-scale=1'>"+
							"<title>Watchlist</title>"+
							"<link rel='stylesheet' href='css/style.css' type='text/css' media='screen' />"+
							"<link rel='stylesheet' href='css/bootstrap.min.css' type='text/css' media='screen' />"+
						"</head>"+
						"<body>"+						
							"<div class='wrapper'>"+
								"<div id='collectlog'>"+
									"<pre id='codepre'>"+
										collectlog +
									"</pre>"+
								"</div>"+
								"<form class='input-group' id='collect' action='/collectwatchlist' method='post'>"+
									"<button class='btn btn-secondary' type='submit'>back</button>"+
								"</form>"+
							"</div>"+
							"<script src='js/jquery-3.1.1.min.js'></script>"+
							"<script src='js/bootstrap.min.js'></script>"+
							"<script src='js/main.js'></script>"+
						"</body>"+
					"</html>";
		
		console.log(collectlog);
		// writing the html
		res.write(watchlistpage);
		// setting the status code
		res.status(200);
		// ending the stream
		res.end();
	});	
	
	// request from "/collect"
	app.post("/collectwatchlist", function(req, res){
		res.redirect("/");
	});
	
	app.get("/select", function(req, res){
		//console.log("data: "+userName);
		//console.log(__dirname+"/userdata/"+userName+"/"+fs.readdirSync(__dirname+"/userdata/"+userName+"/"));
		var files = fs.readdirSync(__dirname+"/userdata/"+userName+"/");
		
		buttons2 = "";
		files.forEach(function(file) {
			buttons = buttons+"<button class=\"btn btn-default files\" type=\"submit\" name=\"file\" value=\""+file+"\">"+file+"</button>";
		});
		
		var html4 =  "<!DOCTYPE html>"+
					"<html lang=\"en\">"+
						"<head>"+
							"<meta content=\"text/html;charset=utf-8\" http-equiv=\"Content-Type\">"+
							"<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">"+
							"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"+
							"<title>WarframeCompare</title>"+
							"<link rel=\"stylesheet\" href=\"css/style.css\" type=\"text/css\" media=\"screen\" />"+
							"<link rel=\"stylesheet\" href=\"css/bootstrap.min.css\" type=\"text/css\" media=\"screen\" />"+
						"</head>"+
						"<body>"+
							"<div class=\"wrapper\">"+
								"<h3>Choose file</h3>"+
								"<form action=\"/select\" method=\"post\">"+ buttons +
								"</form>"+
							"</div>"+
							"<script src=\"js/jquery-3.1.1.min.js\"></script>"+
							"<script src=\"js/bootstrap.min.js\"></script>"+	
						"</body>"+
					"</html>";

		// writing the html
		res.write(html4);
		// setting the status code
		res.status(200);
		// ending the stream
		res.end();

	});

	app.post("/select", function(req, res){
		var path = __dirname+"/userdata/"+userName+"/";
		file1 = req.body.file;
		json1 = fs.readFileSync(path+file1, "utf8");

		res.redirect("/select2");
	});

	app.get("/select2", function(req, res){
		//console.log("data: "+userName);
		//console.log(__dirname+"/userdata/"+userName+"/"+fs.readdirSync(__dirname+"/userdata/"+userName+"/"));
		var files = fs.readdirSync(__dirname+"/userdata/"+userName+"/")
		buttons2 = "";
		files.forEach(function(file) {
			buttons2 = buttons2 + "<button class=\"btn btn-default files\" type=\"submit\" name=\"file\" value=\""+file+"\">"+file+"</button>";
		});

		var html2 = "<!DOCTYPE html>"+
					"<html lang=\"en\">"+
						"<head>"+
							"<meta content=\"text/html;charset=utf-8\" http-equiv=\"Content-Type\">"+
							"<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">"+
							"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"+
							"<title>WarframeCompare</title>"+
							"<link rel=\"stylesheet\" href=\"css/style.css\" type=\"text/css\" media=\"screen\" />"+
							"<link rel=\"stylesheet\" href=\"css/bootstrap.min.css\" type=\"text/css\" media=\"screen\" />"+
						"</head>"+
						"<body>"+
							"<div class=\"wrapper\">"+
								"<h3>Choose 2nd file</h3>"+
								"<form action=\"/select2\" method=\"post\">"+ buttons2 +
									"<button class=\"btn btn-default files\" type=\"submit\" name=\"file\" value=\"server\">Live Server Data</button>"+
								"</form>"+
							"</div>"+
							"<script src=\"jjs/jquery-3.1.1.min.js\"></script>"+
							"<script src=\"js/bootstrap.min.js\"></script>"+	
						"</body>"+
					"</html>";
		
		// writing the html
		res.write(html2);
		// setting the status code
		res.status(200);
		// ending the stream
		res.end();
	});

	app.post("/select2", function(req, res){
		var path = __dirname+"/userdata/"+userName+"/";
		file2 = req.body.file;

		var parsedJson = JSON.parse(json1);
		console.log("userdata file parsed.");

		if (file2 == "server") {
			warframe.viewPlayer(config.login.username, config.login.password, parsedJson.id, function(data) {
				console.log("playerinfo parsed.");
				console.log("rendering page.");
				data.id = parsedJson.id;
				data.DisplayName = parsedJson.DisplayName;

				json2 = JSON.stringify(data);
				console.log(json2);
				res.render("compare", {"data": json1, "kata": json2});
			});
		} else {
			json2 = fs.readFileSync(path+file2, "utf8");
			res.render("compare", {"data": json1, "kata": json2, "file1": file1, "file2": file2});
		}
		console.log("rendering compare");
	});

	app.listen(80, "0.0.0.0", function() {
	  // print a message when the server starts listening
	  console.log("server started on localhost");
	});
	
});