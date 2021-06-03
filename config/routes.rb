Rails.application.routes.draw do
  root "games#index"

  get "games/index"
end
