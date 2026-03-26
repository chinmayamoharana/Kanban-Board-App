from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_board_event(board_id, event_type, payload):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        f'board_{board_id}',
        {
            'type': 'board_message',
            'message': payload,
            'event_type': event_type,
        },
    )
