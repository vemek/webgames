class DrawingChannel < ApplicationCable::Channel
  def subscribed
    stream_from "fake_artist_game_1234"
  end

  def unsubscribed
  end

  def broadcast_drawing(data)
    ActionCable.server.broadcast("fake_artist_game_1234", data)
  end
end
