# Python String methods — full reference.
# Strings are IMMUTABLE: methods return NEW string, original unchanged.
# Grouped by purpose. Each call shows input -> output.

url = "  https://thetestingAcademy.com/login  "
print(url)
print(url.upper())
print(url.strip()) # Remove the extra spaces 

s = "hello world"
print(s.upper())
print(s.lower())
print(s.capitalize()) # first char cap
print(s.title()) # Every first word capitalize
print("xx_iyak_x".strip("x")) # very mood only X whichever mentioned in the argument
print(s.find("o"))
print(s.rfind("l"))
print(s.count("l"))
print("l" in s) # Returns true or false 

csv = "Akshay,Suryawanshi,QA,Pune"
print(csv.split(",")) # Create an list ['Akshay', 'Suryawanshi', 'QA', 'Pune']
print(csv.split(",", 2))

print(",".join(["a","b","c","d"])) #a,b,c,d