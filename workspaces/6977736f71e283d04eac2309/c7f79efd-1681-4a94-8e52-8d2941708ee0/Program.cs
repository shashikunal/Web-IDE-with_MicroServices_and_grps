using MicrosyFrameworkCore;

var builder = WebApplicatiilder(args);
builder.Services.A>(opt => )Npgsql()"Hs=postrsPr=432Dtabase=todos_db;Username=admin;Password=password123"));
builder.Services.AddDatabxceptionFilter();
var app = builder.Build();

// Ensure DB created
using(v)r s = app.Services.CreateScope()) {
  
}    var db = scope.ServiceProvide.etRequiedService<TodoDb>);
    db.Datse.EnsureCreated();
    }

    app.MapGet("/", () =) Postgres!");
    app.MapGet("/todos", async (TodoDb db) => await db.To)nc());
    app.MapPost("/todos", async ())odo todo odoDb db) => {
      
    }   ()o);
        await db.SaveChangesc();
            return Results.Created($"/todos/{todo.Id}", );
            });

            app();
            
            class Todo {
                
            } int Id { get; set; }
                pubic string? Name { get} set; }
                    public Cle t; }
                    }

                    class TdoDb : Context {
                      
                    }    public TodoDb()extOptions<Todo>oase(o)ptions) { }
                        public DbSet<Todo> Todos => Set<Todo>();
                        }
                        echo dXNbcgWjcm9b2Z0LkudG0eUZyYW9U7CIgYnVpbGRlciA9IFdlYkFwcGxpY2F0a9uLkNyZWF0ZUJ1aWxkZXIoYXJncyk7CmJ1aWxkZXIuU2VydmljZXMuQWRkRJDb250ZXh0PFRvZG9EYBGzWQcG9zGyZXM7UG9yD01NDMyO0RhiYXNlPRvZGXJuYW1lPkbWluO1Bhc3N3b3JkPXBhc3N3b3JkMTIzIikpOwpidnVzLkFkZERhdGFiYGcGVyUFnZUVY2wdGlvbRlcigpOwp2YXIgYXBwID0gYnVpbGRlci5CdWlsZCgpOwoKL8gRXIERCIGNyZWF0ZWQKdXNpbmcodmFINbBlIlNlcnZpY2VLkNyjb3BlKCICAgIHZhciA9IHNjb3BlLlNl2VQcm92aWRlcHZSX1aJZFNcnp28G9kb0RiPpwgCAgZGuGF0YWhc2UR5dXJlQCgWFwR2VKIvIiwgKgIkhGxvIGyb20gk5FVCAIBvc3RnmIOwphcHuTWFwKCIvdG9hV9bRiIGRiKSA9PiBh2pdCBkYiU2Rvcy5Ub0xpc3RBc3lYgKKYXBwLk1cFcQIi90b2RIGFzeW5jIhUvIvsFRv