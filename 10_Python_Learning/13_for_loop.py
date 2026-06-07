test_cases = ["login","logout","search","checkout"]

for item in test_cases:
    print(item)

user = {'name': 'Akshay', 'age': 32, 'Vehicle': 'Bike', 'email': 'saml@gmail.com'}
print(user)

#Iterate:
for k, v in user.items(): # for key + value
    print(k, "=", v)

for v in user.values(): # for values
    print(" values: ", v)

for v in user: # for keys
    print(" keys: ", v)

print(list(user.items()))
print(list(user.values()))
print(list(user.keys()))