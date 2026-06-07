# Dictionary is basically key-value pair

# user = {
# "name" : "Akshay",
# "age" : 32,
# "city" : "Pune",
# "Vehicle" : "Bike"
# }
# print(user) #{'name': 'Akshay', 'age': 32, 'city': 'Pune', 'Vehicle': 'Bike'}
# print(user["city"]) 
# print(user.get("age"))
# user["email"] = "saml@gmail.com"
# print(user.get("email"))

# user.pop("city")
# print(user)

# user.clear() # Clear everything or remove everything 
# print(user)

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

# ============================================================
# .List vs Tuple vs Dict — quick compare
# ============================================================
# property        list           tuple          dict
# ------------    -----------    -----------    -----------------
# syntax          [1, 2]         (1, 2)         {"k": "v"}
# mutable         yes            NO             yes
# ordered         yes            yes            yes (3.7+)
# duplicates      yes            yes            keys NO, values yes
# indexable       yes (int)      yes (int)      yes (key)
# use for         growing seq    fixed record   lookup by key