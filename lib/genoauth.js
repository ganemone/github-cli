const genOAuth = async (username, password) => new Promise((res, rej) => {
	require('request')({
		url: 'https://api.github.com/authorizations',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'github-cli',
		},
		auth: {
			'username': username,
			'password': password
		},
		body: JSON.stringify({scopes: ['user', 'public_repo'], note: 'github-cli'})
	}, (err, response, body) => {
		if (err | response.statusCode !== 201 /* created */) {
			rej(err ? err : JSON.parse(body));
		} else {
			res(JSON.parse(response.body)['token']);
		}
	});
});

module.exports = genOAuth;