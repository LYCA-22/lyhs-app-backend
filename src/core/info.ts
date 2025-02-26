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
		'/v1/auth/google': {
			post: {
				summary: '使用 Google 登入',
				description: 'Google 登入',
				tags: ['身份驗證'],
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									flow: { type: 'string' },
									grant_value: { type: 'string' },
									redirect_uri: { type: 'string' },
								},
								required: ['idToken'],
							},
						},
					},
				},
				responses: {
					'200': {
						description: '成功登入',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										userId: { type: 'string', example: '123456' },
										sessionId: { type: 'string', example: '123456-7890' },
									},
								},
							},
						},
					},
					'400': {
						description: '格式錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Invalid flow type',
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
											example: 'Error Login Google account',
										},
									},
								},
							},
						},
					},
				},
			},
		},
		'/v1/psw/change': {
			post: {
				summary: '變更密碼',
				tags: ['密碼管理'],
				security: [
					{
						sessionId: [],
					},
				],
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									oldPassword: { type: 'string' },
									newPassword: { type: 'string' },
								},
								required: ['oldPassword', 'newPassword'],
							},
						},
					},
				},
				responses: {
					'200': {
						description: '成功變更密碼',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										message: {
											type: 'string',
											example: 'Password changed successfully',
										},
									},
								},
							},
						},
					},
					'400': {
						description: '格式錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Information Missing',
										},
									},
								},
							},
						},
					},
					'401': {
						description: '舊密碼錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Incorrect Old Password',
										},
									},
								},
							},
						},
					},
					'404': {
						description: '找不到用戶資訊',
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
											example: 'Error changing password',
										},
									},
								},
							},
						},
					},
				},
			},
		},
		'v1/user/staff/code/create': {
			put: {
				summary: '建立管理人員註冊代碼',
				tags: ['管理人員帳號'],
				security: [
					{
						sessionId: [],
					},
				],
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									vuli: {
										type: 'boolean',
										example: true,
									},
									level: {
										type: 'string',
										example: 'L1',
									},
								},
								required: ['vuli', 'level'],
							},
						},
					},
				},
				responses: {
					'200': {
						description: '成功建立管理人員註冊代碼',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										code: {
											type: 'string',
											example: 'ABC123',
										},
									},
								},
							},
						},
					},
					'400': {
						description: '請求資料格式錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Invalid level or information',
										},
									},
								},
							},
						},
					},
					'403': {
						description: '帳號等級權限不足',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Unauthorized',
										},
									},
								},
							},
						},
					},
					'404': {
						description: '請求帳號不存在',
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
											example: 'Internal server error',
										},
									},
								},
							},
						},
					},
				},
			},
		},
		'v1/user/staff/code/list': {
			get: {
				summary: '列出所有管理人員註冊代碼',
				tags: ['管理人員帳號'],
				security: [
					{
						sessionId: [],
					},
				],
				responses: {
					'200': {
						description: '獲取資料成功',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										data: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													createUserId: { type: 'string', example: 'user123' },
													createUserEmail: {
														type: 'string',
														example: 'user@example.com',
													},
													vuli: { type: 'boolean', example: true },
													level: {
														type: 'string',
														example: 'admin',
													},
													user_number: {
														type: 'number',
														example: 123456,
													},
													createdTime: { type: 'string', example: '2023-01-01T00:00:00Z' },
													registerCode: { type: 'string', example: 'ABC123', minLength: 6, maxLength: 10 },
												},
											},
										},
									},
								},
							},
						},
					},
					'403': {
						description: '帳號權限不夠',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Forbidden',
										},
									},
								},
							},
						},
					},
					'404': {
						description: '找不到用戶資料',
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
						description: '伺服器錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Internal server error',
										},
									},
								},
							},
						},
					},
				},
			},
		},
		'v1/lyps/srm/list': {
			get: {
				summary: '獲取學權信箱列表',
				tags: ['學權信箱'],
				description: '獲取所有學權信箱的資料列表',
				security: [{ sessionId: [] }],
				responses: {
					'200': {
						description: '成功獲取學權信箱列表',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										data: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													id: {
														type: 'string',
														example: '1234567890',
													},
													searchCode: {
														type: 'string',
														example: '567890',
													},
													title: {
														type: 'string',
														example: '學權信箱標題',
													},
													status: {
														type: 'string',
														example: '處理中',
													},
													createdTime: {
														type: 'string',
														example: '2023-04-01T12:00:00.000Z',
													},
													handler: {
														type: 'string',
														example: '處理人姓名',
													},
													email: {
														type: 'string',
														example: '處理人信箱',
													},
												},
											},
										},
									},
								},
							},
						},
					},
					'403': {
						description: '權限不足',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Permission denied',
										},
									},
								},
							},
						},
					},
					'404': {
						description: '找不到用戶資料',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Invalid user',
										},
									},
								},
							},
						},
					},
					'500': {
						description: '伺服器錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Server error',
										},
									},
								},
							},
						},
					},
				},
			},
		},
		'/v1/lyps/srm/add': {
			put: {
				summary: '新增學權信箱',
				tags: ['學權信箱'],
				requestBody: {
					require: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									email: {
										type: 'string',
										format: 'email',
										example: 'user@example.com',
									},
									name: {
										type: 'string',
										example: 'Zhicheng',
									},
									type: {
										type: 'string',
										example: 'type',
									},
									title: {
										type: 'string',
										example: 'title',
									},
									description: {
										type: 'string',
										example: 'description',
									},
									Class: {
										type: 'string',
										example: 'Class',
									},
									number: {
										type: 'number',
										example: 19,
									},
									solution: {
										type: 'string',
										example: 'I want ...',
									},
								},
							},
						},
					},
				},
				responses: {
					'200': {
						description: '新增成功',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										code: {
											type: 'string',
											example: '123456',
										},
									},
								},
							},
						},
					},
					'500': {
						description: '伺服器錯誤',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										error: {
											type: 'string',
											example: 'Server error',
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
