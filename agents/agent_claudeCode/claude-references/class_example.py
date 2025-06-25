class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author
    def display_info(self):
        print(f"'{self.title}' by {self.author}")

book = Book("1984", "George Orwell")
book.display_info() 