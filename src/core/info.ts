export const openapi = {
	openapi: '3.0.0',
	info: {
		title: '林園高中校園資訊整合系統 API 技術文件',
		version: '1.0.0',
		contact: {
			name: 'Zhicheng',
			url: 'https://lyhsca.org',
			email: 'cheng@lyhsca.org',
		},
	},
	servers: [
		{
			url: 'https://api.lyhsca.org',
			description: 'Production',
		},
		{
			url: 'https://lyhsca.org',
			description: 'Production',
		},
		{
			url: 'https://localhost:8787',
			description: 'development',
		},
	],
	components: {
		securitySchemes: {
			sessionId: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'opaque',
			},
			userId: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'opaque',
			},
		},
	},
	paths: {
		'/v1/status': {
			get: {
				summary: '取得服務狀態',
				tags: ['基礎建設'],
				description: 'LYHS+ 系統運作狀態',
				responses: {
					'200': {
						description: '請求成功',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'string',
											example: 'operational',
										},
										version: {
											type: 'string',
											example: '1.0.0',
										},
										service: {
											type: 'object',
											properties: {
												database: {
													type: 'object',
													properties: {
														status: {
															type: 'string',
															example: 'connected',
														},
														latency: {
															type: 'string',
															example: '854ms',
														},
													},
												},
											},
										},
										timestamp: {
											type: 'string',
											example: '2025-02-22T15:13:29.274Z',
										},
										environment: {
											type: 'string',
											example: 'production',
										},
									},
								},
							},
						},
					},
					'500': {
						description: '發生不明錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Error check service status',
										},
									},
								},
							},
						},
					},
				},
			},
		},
		'/v1/user/data': {
			get: {
				summary: '取得帳號資料',
				tags: ['會員帳號'],
				description: '取得帳號相關資料',
				security: [
					{
						sessionId: [],
					},
				],
				responses: {
					'200': {
						description: '取得資料成功',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										data: {
											type: 'object',
											properties: {
												auth_person: { type: 'string', example: 'Zhicheng' },
												class: { type: 'string', example: 'C1' },
												email: { type: 'string', example: 'example@lyhsca.org' },
												grade: { type: 'string', example: 'G1' },
												id: { type: 'string', example: '123456' },
												level: { type: 'string', example: 'L1' },
												name: { type: 'string', example: 'Zhicheng' },
												role: { type: 'string', example: 'R1' },
												type: { type: 'string', example: 'normal' },
											},
										},
									},
								},
							},
						},
					},
					'400': {
						description: '無 sessionId / 格式錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'SessionId is missing or malformed',
										},
									},
								},
							},
						},
					},
					'401': {
						description: '驗證錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Invalid or expired token',
										},
									},
								},
							},
						},
					},
					'404': {
						description: '找不到用戶',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'User not found',
										},
									},
								},
							},
						},
					},
					'500': {
						description: '發生不明錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Error fetching user data',
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
};
