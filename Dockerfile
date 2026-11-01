FROM ruby:3.2-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only Gemfile (not Gemfile.lock since it needs to be regenerated)
COPY Gemfile ./

# Install gems (this will create a new Gemfile.lock)
RUN bundle install

# Copy the rest of the application
COPY . .

# Expose port 4000 for Jekyll
EXPOSE 4000

# Run Jekyll server
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload"]