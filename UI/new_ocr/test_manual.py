from ai_categorizer import categorize_manual_item
import json

item_name = input("Enter item name: ")

try:
    amount = float(input("Enter amount: "))
except ValueError:
    print("Invalid amount entered.")
    exit()

result = categorize_manual_item(item_name, amount)

print("\n--- Categorized Transaction ---\n")
print(json.dumps(result, indent=2))
